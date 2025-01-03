# BLOGGING_BACKEND

# BLOGGING_BACKEND


// Update a profile

constupdateProfile=asyncHandler(async(req,res)=> {

  const {

    fullname,

    location,

    hobbies,

    bio,

    link,

    socialMedia,

    email,

    savedPost,

    follower,

    following,

    totalView,

  } =req.body;

  // Ensure required fields are provided

  if (

    [fullname,location,hobbies,bio,link,socialMedia].some(

    (field)=>!field?.trim()

    )

  ) {

    thrownewapiError(422,"Please fill in all the required fields");

  }

  // Process uploaded files

  constavatarLocalPath=req.files?.avatar?.[0]?.path;

  constcoverImageLocalPath=req.files?.coverImage?.[0]?.path;

  // Upload to Cloudinary

  constavatar=avatarLocalPath

    ?awaituploadFileToCloudinary(avatarLocalPath)

    :null;

  constcoverImage=coverImageLocalPath

    ?awaituploadFileToCloudinary(coverImageLocalPath)

    :null;

  constupdate= {

    fullname,

    location,

    hobbies,

    bio,

    link,

    socialMedia,

    email,

    savedPost,

    follower,

    following,

    totalView,

    avatar:avatar?.url||undefined,

    coverImage:coverImage?.url||undefined,

  };

  constprofile=awaitProfile.findOneAndUpdate(

    { username:req.user.username },

    update,

    {

    new:true,// Return the updated document

    }

  );

  if (!profile) {

    thrownewapiError(500,"Failed to update the profile");

  }

  returnres.status(200).json(

    newapiResponse(

    200,

    {

    fullname:profile.fullname,

    location:profile.location,

    hobbies:profile.hobbies,

    bio:profile.bio,

    link:profile.link,

    socialMedia:profile.socialMedia,

    email:profile.email,

    savedPost:profile.savedPost,

    follower:profile.follower,

    following:profile.following,

    totalView:profile.totalView,

    avatar:profile.avatar,

    coverImage:profile.coverImage,

    },

    "Profile updated successfully."

    )

  );

});

// Get profile by username

constgetProfile=asyncHandler(async(req,res)=> {

  const { username } =req.params;

  constprofile=awaitProfile.findOne({ username })

    .populate("email")

    .populate("savedPost")

    .populate("follower")

    .populate("following")

    .populate("totalView");

  if (!profile) {

    thrownewapiError(404,"Profile not found.");

  }

  returnres.status(200).json(

    newapiResponse(

    200,

    {

    fullname:profile.fullname,

    location:profile.location,

    hobbies:profile.hobbies,

    bio:profile.bio,

    link:profile.link,

    socialMedia:profile.socialMedia,

    email:profile.email,

    savedPost:profile.savedPost,

    follower:profile.follower,

    following:profile.following,

    totalView:profile.totalView,

    avatar:profile.avatar,

    coverImage:profile.coverImage,

    },

    "Profile fetched successfully."

    )

  );

});

// Update User Avatar

constupdateUserAvatar=asyncHandler(async(req,res)=> {

  constavatarLocalPath=req.file?.path;

  if (!avatarLocalPath) {

    thrownewapiError(404,"Avatar file is missing");

  }

  constuser=awaitProfile.findById(req.profile._id);

  if (!user) {

    thrownewapiError(404,"User not found");

  }

  constoldAvatarUrl=user.avatar;

  constnewAvatar=awaituploadFileToCloudinary(avatarLocalPath,oldAvatarUrl);

  if (!newAvatar.url) {

    thrownewapiError(400,"Error while uploading avatar");

  }

  constupdatedUser=awaitProfile.findByIdAndUpdate(

    req.profile._id,

    { $set: { avatar:newAvatar.url } },

    { new:true }

  );

  returnres

    .status(200)

    .json(

    newapiResponse(200,updatedUser,"Avatar image updated successfully")

    );

});

// Update User Cover Image

constupdateUserCoverImage=asyncHandler(async(req,res)=> {

  constcoverImageLocalPath=req.file?.path;

  if (!coverImageLocalPath) {

    thrownewapiError(404,"Cover image file is missing");

  }

  constcoverImage=awaituploadFileToCloudinary(coverImageLocalPath);

  if (!coverImage.url) {

    thrownewapiError(400,"Error while uploading cover image");

  }

  constuser=awaitProfile.findByIdAndUpdate(

    req.profile._id,

    { $set: { coverImage:coverImage.url } },

    { new:true }

  );

  returnres

    .status(200)

    .json(newapiResponse(200,user,"Cover image updated successfully"));

});

export {

  createProfile,

  updateProfile,

  getProfile,

  updateUserAvatar,

  updateUserCoverImage,

};
