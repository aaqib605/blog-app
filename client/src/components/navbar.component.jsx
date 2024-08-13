import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import logo from "../imgs/logo.png";
import { UserContext } from "../App";
import UserNavigationPanel from "./user-navigation.component";
import axios from "axios";

const Navbar = () => {
  const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
  const [userNavPanel, setUserNavPanel] = useState(false);

  const navigate = useNavigate();

  const {
    userAuth,
    userAuth: { jwtToken, profileImg, newNotificationAvailable },
    setUserAuth,
  } = useContext(UserContext);

  const handleSearchInput = (e) => {
    const inputValue = e.target.value;

    if (e.keyCode === 13 && inputValue.length) {
      navigate(`/search/${inputValue}`);
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (jwtToken) {
          const { data } = await axios.get(
            `${import.meta.env.VITE_SERVER_DOMAIN}/new-notification`,
            {
              headers: {
                Authorization: `Bearer ${jwtToken}`,
              },
            }
          );

          setUserAuth({ ...userAuth, ...data });
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchNotifications();
  }, [jwtToken]);

  return (
    <>
      <nav className="navbar z-50">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="logo" className="w-full" />
        </Link>

        <div
          className={`absolute bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:block md:relative md:inset-0 md:p-0 md:w-auto md:show
        ${searchBoxVisibility ? "show" : "hide"}`}
        >
          <input
            type="text"
            placeholder="Search"
            className="w-full md:w-auto bg-grey p-4 pl-6 pr-[12%] md:pr-6 rounded-full placeholder:text-dark-grey md:pl-12"
            onKeyDown={handleSearchInput}
          />
          <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
        </div>

        <div className="flex items-center gap-3 md:gap-6 ml-auto">
          <button
            className="md:hidden bg-grey w-12 h-12 rounded-full flex justify-center items-center"
            onClick={() => setSearchBoxVisibility((prevState) => !prevState)}
          >
            <i className="fi fi-rr-search text-xl"></i>
          </button>

          <Link to="/editor" className="hidden md:flex gap-2 link">
            <i className="fi fi-rr-file-edit"></i>
            <span>Write</span>
          </Link>

          {jwtToken ? (
            <>
              <Link to="/dashboard/notification">
                <button className="w-12 h-12 rounded-full bg-grey relative hover:bg-black/10 flex justify-center items-center">
                  <i className="fi fi-rr-bell text-xl"></i>
                  {newNotificationAvailable ? (
                    <span className="bg-red w-3 h-3 rounded-full absolute z-10 top-2 right-2"></span>
                  ) : (
                    ""
                  )}
                </button>
              </Link>

              <div
                className="relative"
                onClick={() => setUserNavPanel((prevState) => !prevState)}
                onBlur={() =>
                  setTimeout(() => {
                    setUserNavPanel(false);
                  }, 200)
                }
              >
                <button className="w-12 h-12 flex justify-center items-center">
                  <img
                    className="w-full h-full object-cover rounded-full"
                    src={profileImg}
                    alt="User Icon"
                  />
                </button>

                {userNavPanel && <UserNavigationPanel />}
              </div>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn-dark py-2">
                Sign In
              </Link>

              <Link to="/signup" className="btn-light py-2 hidden md:block">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <Outlet />
    </>
  );
};

export default Navbar;
