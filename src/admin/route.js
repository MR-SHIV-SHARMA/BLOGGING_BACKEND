import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/users/user.models";
import { NextResponse } from "next/server";
import { getDataFromToken } from "@/helpers/getDataFromToken";

connect();

export async function POST(request) {
  try {
    // extract data from token
    const userId = await getDataFromToken(request);
    if (!userId) {
      return NextResponse.json({
        message: "Invalid or missing token",
      }, { status: 401 });
    }

    // Find the user by ID, excluding the password field
    const user = await User.findOne({ _id: userId }).select("-password");
    
    if (!user) {
      return NextResponse.json({
        message: "User not found",
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "User found",
      data: user,
    });
  } catch (error) {
    return NextResponse.json({
      message: "An error occurred",
      error: error.message,
    }, { status: 500 });
  }
}
