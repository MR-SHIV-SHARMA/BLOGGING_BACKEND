import { connect } from "../../../../dbConfig/dbConfig";
import User from "../../../../models/users/user.models";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { sendEmail } from "../../../../helpers/mailer";

connect();

export async function POST(request) {
  try {
    const reqBody = await request.json();
    const { username, email, password, firstname, lastname } = reqBody;

    // Validation
    console.log(reqBody);

    const user = await User.findOne({ email });

    if (user) {
      return NextResponse.json(
        { error: "user already exists" },
        {
          status: 400,
        }
      );
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashPassword,
      firstname,
      lastname,
    });

    const savedUser = await newUser.save();
    console.log(savedUser);

    // Send verification email
    await sendEmail({ email, emailType: "VERIFY", userId: savedUser._id });

    return NextResponse.json({
      message: "user created successfully",
      success: true,
      savedUser,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // Extract query parameters from the URL
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Check if userId is provided
    if (!userId) {
      return NextResponse.json(
        { error: "UserId must be provided" },
        { status: 400 }
      );
    }

    // Build query object
    const query = { _id: userId };

    // Find user in the database
    const user = await User.findOne(query).select("-password"); // Exclude password from response

    // Check if user is found
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
