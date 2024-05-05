import { Link } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import AnimationWrapper from "../common/page-animation";
import { storeInSession } from "../common/session";

const UserAuthForm = ({ type }) => {
  const userAuthThroughServer = (serverRoute, formData) => {
    const serverDomain = import.meta.env.VITE_SERVER_DOMAIN;

    axios
      .post(`${serverDomain + serverRoute}`, formData)
      .then(({ data }) => {
        storeInSession(JSON.stringify(data));
        console.log(sessionStorage);
      })
      .catch(({ response }) => {
        toast.error(response.data.error);
      });
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

  return (
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

          <button className="btn-dark flex justify-center items-center gap-4 w-[90%] center">
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
