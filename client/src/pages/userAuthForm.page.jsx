import { useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import AnimationWrapper from "../common/page-animation";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";

const UserAuthForm = ({ type }) => {
  const {
    userAuth: { jwtToken },
    setUserAuth,
  } = useContext(UserContext);

  const userAuthThroughServer = async (serverRoute, formData) => {
    try {
      const serverDomain = import.meta.env.VITE_SERVER_DOMAIN;

      const { data } = await axios.post(
        `${serverDomain + serverRoute}`,
        formData
      );

      storeInSession("user", JSON.stringify(data));
      setUserAuth(data);
    } catch (error) {
      toast.error(error.response.data.error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const serverRoute = type === "Sign In" ? "/signin" : "/signup";

    const htmlForm = new FormData(formElement);
    const formData = {};

    for (const [key, value] of htmlForm.entries()) {
      formData[key] = value;
    }

    const { fullname, email, password } = formData;

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    if (fullname?.length < 3) {
      return toast.error("Fullname must be at least 3 characters long");
    }

    if (!email.length || !emailRegex.test(email)) {
      return toast.error("Invalid email address");
    }

    if (!passwordRegex.test(password)) {
      return toast.error(
        "The password must be 6-20 characters long and include at least one numeric, lowercase, and uppercase letter."
      );
    }

    userAuthThroughServer(serverRoute, formData);
  };

  const handleGoogleAuth = async (e) => {
    try {
      e.preventDefault();
      const user = await authWithGoogle();

      const serverRoute = "/google-auth";

      let formData = { accessToken: user.accessToken };

      userAuthThroughServer(serverRoute, formData);
    } catch (error) {
      toast.error(error);
    }
  };

  return jwtToken ? (
    <Navigate to="/" />
  ) : (
    <AnimationWrapper keyValue={type}>
      <section className="h-cover flex items-center justify-center">
        <Toaster />
        <form id="formElement" className="w-[80%] max-w-[400px]">
          <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
            {type === "Sign In" ? "Welcome Back" : "Join Us Today!"}
          </h1>

          {type === "Sign Up" ? (
            <InputBox
              name="fullname"
              type="text"
              placeholder="Full Name"
              icon="fi-rr-user"
            />
          ) : (
            ""
          )}

          <InputBox
            name="email"
            type="email"
            placeholder="Email"
            icon="fi-rr-envelope"
          />

          <InputBox
            name="password"
            type="password"
            placeholder="Password"
            icon="fi-rr-key"
          />

          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-dark center mt-14"
          >
            {type}
          </button>

          <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
            <hr className="w-1/2 border-black" />
            <span>or</span>
            <hr className="w-1/2 border-black" />
          </div>

          <button
            className="btn-dark flex justify-center items-center gap-4 w-[90%] center"
            onClick={handleGoogleAuth}
          >
            <img src={googleIcon} alt="Google Icon" className="w-5" />
            continue with google
          </button>

          {type === "Sign In" ? (
            <p className="mt-6 text-dark-grey text-xl text-center">
              Don't have an account?
              <Link to="/signup" className="underline text-black text-xl ml-1">
                Join us today
              </Link>
            </p>
          ) : (
            <p className="mt-6 text-dark-grey text-xl text-center">
              Already a member?
              <Link to="/signin" className="underline text-black text-xl ml-1">
                Sign in here
              </Link>
            </p>
          )}
        </form>
      </section>
    </AnimationWrapper>
  );
};

export default UserAuthForm;
