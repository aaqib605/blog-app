import { createContext, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.component";
import HomePage from "./pages/home.page";
import UserAuthForm from "./pages/userAuthForm.page";
import Editor from "./pages/editor.page";
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import { lookInSession } from "./common/session";
import SideNav from "./components/sidenavbar.component";

export const UserContext = createContext({});

const App = () => {
  const [userAuth, setUserAuth] = useState({});

  useEffect(() => {
    const userInSession = lookInSession("user");

    userInSession
      ? setUserAuth(JSON.parse(userInSession))
      : setUserAuth({ accessToken: null });
  }, []);

  return (
    <UserContext.Provider value={{ userAuth, setUserAuth }}>
      <Routes>
        <Route path="/" element={<Navbar />}>
          <Route index element={<HomePage />} />
          <Route path="settings" element={<SideNav />}>
            <Route path="edit-profile" element={<h1>Edit profile page</h1>} />
            <Route
              path="change-password"
              element={<h1>Change password page</h1>}
            />
          </Route>
          <Route path="signin" element={<UserAuthForm type="Sign In" />} />
          <Route path="signup" element={<UserAuthForm type="Sign Up" />} />
          <Route path="search/:query" element={<SearchPage />} />
          <Route path="user/:id" element={<ProfilePage />} />
          <Route path="blog/:blogId" element={<BlogPage />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
        <Route path="/editor" element={<Editor />} />
        <Route path="/editor/:blogId" element={<Editor />} />
      </Routes>
    </UserContext.Provider>
  );
};

export default App;
