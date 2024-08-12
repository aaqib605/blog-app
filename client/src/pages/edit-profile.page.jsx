import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { UserContext } from "../App";
import { profileDataStructure } from "./profile.page";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import InputBox from "../components/input.component";
import { uploadImage } from "../common/aws";
import { storeInSession } from "../common/session";

const EditProfile = () => {
  const {
    userAuth,
    userAuth: { jwtToken },
    setUserAuth,
  } = useContext(UserContext);

  const bioCharactersLimit = 150;

  const profileImgRef = useRef();
  const editProfileForm = useRef();

  const [profile, setProfile] = useState(profileDataStructure);
  const [loading, setLoading] = useState(true);
  const [charactersLeft, setCharactersLeft] = useState(bioCharactersLimit);
  const [updatedProfileImg, setUpdatedProfileImg] = useState(null);

  const {
    personalInfo: {
      fullname,
      username: profileUsername,
      profileImg,
      email,
      bio,
    },
    socialLinks,
  } = profile;

  const handleBioTextareaChange = (e) => {
    const textareaInputLength = e.target.value.length;

    setCharactersLeft(bioCharactersLimit - textareaInputLength);
  };

  const handlePreviewImage = (e) => {
    const img = e.target.files[0];

    profileImgRef.current.src = URL.createObjectURL(img);

    setUpdatedProfileImg(img);
  };

  const handleUploadImage = async (e) => {
    e.preventDefault();

    try {
      if (updatedProfileImg) {
        const loadingToast = toast.loading("Uploading profile image");

        e.target.setAttribute("disabled", true);

        const imgURL = await uploadImage(updatedProfileImg);

        if (imgURL) {
          const { data } = await axios.post(
            `${import.meta.env.VITE_SERVER_DOMAIN}/update-profile-img`,
            { imgURL },
            {
              headers: {
                Authorization: `Bearer ${jwtToken}`,
              },
            }
          );

          const newUserAuth = { ...userAuth, profileImg: data.profileImg };

          storeInSession("user", JSON.stringify(newUserAuth));

          setUserAuth(newUserAuth);
          setUpdatedProfileImg(null);
          toast.dismiss(loadingToast);

          e.target.removeAttribute("diabled");

          toast.success("Image updated successfully.");
        }
      }
    } catch (error) {
      console.log(error);
      toast.dismiss(loadingToast);

      e.target.removeAttribute("diabled");

      toast.error("Error updating profile image.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(editProfileForm.current);
    const formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    const {
      username,
      bio,
      youtube,
      twitter,
      facebook,
      github,
      instagram,
      website,
    } = formData;

    if (username.length < 3) {
      return toast.error("Username must be at least 3 characters long.");
    }

    if (bio.length > bioCharactersLimit) {
      return toast.error(`Bio should not be larger than ${bioCharactersLimit}`);
    }

    const loadingToast = toast.loading("Updating...");
    e.target.setAttribute("disabled", true);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/update-profile`,
        {
          username,
          bio,
          socialLinks: {
            youtube,
            twitter,
            facebook,
            github,
            instagram,
            website,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      if (userAuth.username !== data.username) {
        const newUserAuth = { ...userAuth, username: data.username };

        storeInSession("user", JSON.stringify(newUserAuth));
        setUserAuth(newUserAuth);
      }

      toast.dismiss(loadingToast);
      e.target.removeAttribute("disabled");
      toast.success("Profile updated successfully.");
    } catch ({ response }) {
      toast.dismiss(loadingToast);
      e.target.removeAttribute("disabled");
      toast.error(response.data.error);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_SERVER_DOMAIN}/get-profile`,
          { username: userAuth.username }
        );

        setProfile(data);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };

    if (jwtToken) {
      fetchUserData();
    }
  }, [jwtToken]);

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <form ref={editProfileForm}>
          <Toaster />

          <h1 className="max-md:hidden">Edit Profile</h1>

          <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
            <div className="max-lg:center mb-5">
              <label
                htmlFor="uploadImg"
                id="profileImgLabel"
                className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden"
              >
                <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/50 opacity-0 hover:opacity-100 cursor-pointer">
                  Upload Image
                </div>
                <img ref={profileImgRef} src={profileImg} alt="User profile" />
              </label>

              <input
                type="file"
                id="uploadImg"
                accept=".jpeg, .png, .jpg"
                hidden
                onChange={handlePreviewImage}
              />

              <button
                className="btn-light mt-5 max-lg:center lg:w-full px-10"
                onClick={handleUploadImage}
              >
                Upload
              </button>
            </div>

            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                <div>
                  <InputBox
                    name="fullname"
                    type="text"
                    value={fullname}
                    placeholder="Full Name"
                    disable={true}
                    icon="fi-rr-user"
                  />
                </div>

                <div>
                  <InputBox
                    name="email"
                    type="email"
                    value={email}
                    placeholder="Email"
                    disable={true}
                    icon="fi-rr-envelope"
                  />
                </div>
              </div>

              <InputBox
                type="text"
                name="username"
                value={profileUsername}
                placeholder="Username"
                icon="fi-rr-at"
              />

              <p className="text-dark-grey -mt-3">
                The username can be used for user searches and will be visible
                to everyone.
              </p>

              <textarea
                name="bio"
                maxLength={bioCharactersLimit}
                defaultValue={bio}
                className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5 placeholder:text-dark-grey"
                placeholder="Enter bio"
                onChange={handleBioTextareaChange}
              ></textarea>

              <p className="mt-1 text-dark-grey">
                {charactersLeft} characters left
              </p>

              <p className="my-6 text-dark-grey">
                Add your social handles below
              </p>

              <div className="md:grid md:grid-cols-2 gap-x-6">
                {Object.keys(socialLinks).map((key, index) => {
                  const link = socialLinks[key];

                  return (
                    <InputBox
                      key={index}
                      name={key}
                      type="text"
                      value={link}
                      placeholder="https://"
                      icon={`${
                        key === `website` ? `fi-rr-globe` : `fi-brands-${key}`
                      }`}
                    />
                  );
                })}
              </div>

              <button
                className="btn-dark w-auto px-10"
                type="submit"
                onClick={handleSubmit}
              >
                Update
              </button>
            </div>
          </div>
        </form>
      )}
    </AnimationWrapper>
  );
};

export default EditProfile;
