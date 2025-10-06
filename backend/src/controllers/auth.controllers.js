import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../lib/utils.js';
import { ENV } from "../lib/env.js";
import { sendWelcomeEmail } from "../emails/emailHandler.js";
export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        const emailRegx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegx.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        });

        if(newUser){
            const savedUser = await newUser.save();
            generateToken(savedUser._id, res);
            
            // Send welcome email (don't block response on email failure)
            try {
                await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
                console.log('Welcome email sent successfully to:', savedUser.email);
            } catch (error) {
                console.error('Error sending welcome email:', error);
                // Don't fail registration if email fails
            }

            return res.status(201).json(
                { 
                    message: 'User registered successfully',
                    _id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    profilePic: newUser.profilePic,
                }
            );

        }else{
            return res.status(400).json({ message: 'Invalid user data' });
        }

    } catch (error) {
        console.log(error);
        
        return res.status(500).json({ message: 'Internal server error' });
    }

}

export const login = async (req, res) => {
    const {email, password} = req.body;
     if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

    try {
      const user = await User.findOne({email})
      if(!user){
        return res.status(400).json({message: 'Invalid email or password'})
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if(!isPasswordValid){
        return res.status(400).json({message: 'Invalid email or password'})
      }
    generateToken(user._id, res);
    return res.status(200).json(
        { 
            message: 'User logged in successfully',
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        }
    );
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const logout = (_, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};