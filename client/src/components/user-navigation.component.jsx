import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../App";
import AnimationWrapper from "../common/page-animation";
import { removeFromSession } from "../common/session";

const UserNavigationPanel = () => {
  const {
    userAuth: { username },
    setUserAuth,
  } = useContext(UserContext);

  const signOutUser = () => {
    removeFromSession("user");
    setUserAuth({ jwtToken: null });
  };

  return (
    <AnimationWrapper
      transition={{ duration: 0.2 }}
      className="absolute right-0 z-50"
    >
      <div
        className={`bg-white absolute right-0 border border-grey mt-1 w-60 overflow-hidden duration-200`}
      >
        <Link to="/editor" className="flex gap-2 link md:hidden pl-8 py-4">
          <i className="fi fi-rr-file-edit"></i>
          <span>Write</span>
        </Link>

        <Link to={`/user/${username}`} className="link pl-8 py-4">
          Profile
        </Link>

        <Link to="/dashboard/blogs" className="link pl-8 py-4">
          Dashboard
        </Link>

        <Link to="/settings/edit-profile" className="link pl-8 py-4">
          Settings
        </Link>

        <span className="absolute border-t border-grey bg-red w-[100%]"></span>

        <button
          className="flex flex-col text-left p-4 hover:bg-grey w-full pl-8 py-4"
          onClick={signOutUser}
        >
          <span className="font-semibold text-xl mb-1">Sign Out</span>
          <span className="text-dark-grey">@{username}</span>
        </button>
      </div>
    </AnimationWrapper>
  );
};

export default UserNavigationPanel;
