import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import AboutUser from "../components/about.component";
import { UserContext } from "../App";
import filterPaginationData from "../common/filter-pagination-data";
import InPageNavigation from "../components/inpage-navigation.component";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import LoadMoreBlogsBtn from "../components/load-more.component";
import PageNotFound from "./404.page";

export const profileDataStructure = {
  personalInfo: {
    fullname: "",
    username: "",
    bio: "",
    profileImg: "",
  },
  socialLinks: {},
  accountInfo: {
    totalPosts: 0,
    totalReads: 0,
  },
  joinedAt: "",
};

const ProfilePage = () => {
  const { id: profileId } = useParams();

  const [profile, setProfile] = useState(profileDataStructure);
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState("");

  const {
    personalInfo: { fullname, username: profileUsername, profileImg, bio },
    accountInfo: { totalPosts, totalReads },
    socialLinks,
    joinedAt,
  } = profile;

  const {
    userAuth: { username },
  } = useContext(UserContext);

  const fetchUserProfile = async () => {
    try {
      const { data: user } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/get-profile`,
        { username: profileId }
      );

      if (user !== null) {
        setProfile(user);
      }

      setProfileLoaded(profileId);
      getBlogs({ userId: user._id });
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const getBlogs = async ({ page = 1, userId }) => {
    try {
      userId = userId === undefined ? blogs.userId : userId;

      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/search-blogs`,
        {
          author: userId,
          page,
        }
      );

      const formattedData = await filterPaginationData({
        existingBlogs: blogs,
        newFetchedBlogs: data.blogs,
        page,
        countRoute: "search-blogs-count",
        dataToSend: { author: userId },
      });

      formattedData.userId = userId;

      setBlogs(formattedData);
    } catch (error) {}
  };

  const resetState = () => {
    setProfile(profileDataStructure);
    setLoading(true);
    setProfileLoaded("");
  };

  useEffect(() => {
    if (profileId !== profileLoaded) {
      setBlogs(null);
    }

    if (blogs === null) {
      resetState();
      fetchUserProfile();
    }
  }, [profileId, blogs]);

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : profileUsername.length ? (
        <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
          <div className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[30%] md:pl-8 md:border-l border-grey md:sticky md:top-[100px] md:py-10">
            <img
              src={profileImg}
              alt="User profile"
              className="w-48 h-48 bg-grey rounded-full md:w-32 md:h-32 border-2 border-grey"
            />

            <h1 className="text-2xl font-medium">@{profileUsername}</h1>

            <p className="text-xl capitalize h-6">{fullname}</p>

            <p>
              {totalPosts.toLocaleString()} Blogs -{" "}
              {totalReads.toLocaleString()} Reads
            </p>

            <div className="flex gap-4 mt-2">
              {profileId === username ? (
                <Link
                  to="settings/edit-profile"
                  className="btn-light rounded-md"
                >
                  Edit Profile
                </Link>
              ) : (
                ""
              )}
            </div>

            <AboutUser
              bio={bio}
              socialLinks={socialLinks}
              joinedAt={joinedAt}
              className="max-md:hidden"
            />
          </div>

          <div className="max-md:mt-12 w-full">
            <InPageNavigation
              routes={["Published Blogs", "About"]}
              defaultHidden={["About"]}
            >
              <>
                {blogs === null ? (
                  <Loader />
                ) : blogs.results.length ? (
                  blogs.results.map((blog, index) => {
                    return (
                      <AnimationWrapper
                        key={index}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      >
                        <BlogPostCard
                          blog={blog}
                          author={blog.author.personalInfo}
                        />
                      </AnimationWrapper>
                    );
                  })
                ) : (
                  <NoDataMessage message={"No blogs published."} />
                )}

                <LoadMoreBlogsBtn state={blogs} fetchDataFunction={getBlogs} />
              </>

              <AboutUser
                bio={bio}
                socialLinks={socialLinks}
                joinedAt={joinedAt}
              />
            </InPageNavigation>
          </div>
        </section>
      ) : (
        <PageNotFound />
      )}
    </AnimationWrapper>
  );
};

export default ProfilePage;
