import { useContext, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { UserContext } from "../App";
import axios from "axios";

const ChangePassword = () => {
  const {
    userAuth: { jwtToken },
  } = useContext(UserContext);
  const changePasswordForm = useRef();

  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData(changePasswordForm.current);
    const formData = {};

    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }

    const { currentPassword, newPassword } = formData;

    if (!currentPassword.length || !newPassword.length) {
      return toast.error("Fill all input fields");
    }

    if (
      !passwordRegex.test(currentPassword) ||
      !passwordRegex.test(newPassword)
    ) {
      return toast.error(
        "The password must be 6 to 20 characters in length and include a number, one lowercase letter, and one uppercase letter."
      );
    }

    e.target.setAttribute("disabled", true);

    const loadingToast = toast.loading("Updating password...");

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/change-password`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      );

      toast.dismiss(loadingToast);
      e.target.removeAttribute("disabled");
      return toast.success("Password changed successfully.");
    } catch ({ response }) {
      toast.dismiss(loadingToast);
      e.target.removeAttribute("disabled");
      return toast.error(response.data.error);
    }
  };

  return (
    <AnimationWrapper>
      <Toaster />

      <form ref={changePasswordForm}>
        <h1 className="max-md:hidden">Change Password</h1>

        <div className="py-10 w-full md:max-w-[400px]">
          <InputBox
            name="currentPassword"
            type="password"
            className="profile-edit-input"
            placeholder="Current Password"
            icon="fi-rr-unlock"
          />
          <InputBox
            name="newPassword"
            type="password"
            className="profile-edit-input"
            placeholder="New Password"
            icon="fi-rr-unlock"
          />

          <button
            className="btn-dark px-10"
            type="submit"
            onClick={handleSubmit}
          >
            Change Password
          </button>
        </div>
      </form>
    </AnimationWrapper>
  );
};

export default ChangePassword;
