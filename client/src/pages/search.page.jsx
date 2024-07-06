import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import InPageNavigation from "../components/inpage-navigation.component";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import NoDataMessage from "../components/nodata.component";
import AnimationWrapper from "../common/page-animation";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreBlogsBtn from "../components/load-more.component";
import UserCard from "../components/usercard.component";

const SearchPage = () => {
  const [blogs, setBlogs] = useState(null);
  const [users, setUsers] = useState(null);

  const { query } = useParams();

  const searchBlogs = async ({ page = 1, createNewArr = false }) => {
    try {
      const {
        data: { blogs: newFetchedBlogs },
      } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/search-blogs`,
        { query, page }
      );

      const formattedData = await filterPaginationData({
        existingBlogs: blogs,
        newFetchedBlogs,
        page,
        countRoute: "search-blogs-count",
        dataToSend: { query },
        createNewArr,
      });

      setBlogs(formattedData);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const {
        data: { users },
      } = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/search-users`,
        { query }
      );

      setUsers(users);
    } catch (error) {
      console.log(error.message);
    }
  };

  const resetState = () => {
    setBlogs(null);
    setUsers(null);
  };

  const UserCardWrapper = () => {
    return (
      <>
        {users === null ? (
          <Loader />
        ) : users.length ? (
          users.map((user, index) => {
            return (
              <AnimationWrapper
                key={index}
                transition={{ duration: 1, delay: index * 0.08 }}
              >
                <UserCard user={user} />
              </AnimationWrapper>
            );
          })
        ) : (
          <NoDataMessage message={"No user found."} />
        )}
      </>
    );
  };

  useEffect(() => {
    resetState();
    searchBlogs({ page: 1, createNewArr: true });
    fetchUsers();
  }, [query]);

  return (
    <section className="h-cover flex justify-center gap-10">
      <div className="w-full">
        <InPageNavigation
          routes={[`Search results for "${query}"`, "Accounts matched"]}
          defaultHidden={["Accounts matched"]}
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

            <LoadMoreBlogsBtn state={blogs} fetchDataFunction={searchBlogs} />
          </>

          <UserCardWrapper />
        </InPageNavigation>
      </div>

      <div className="min-w-[40%] lg:min-w-[350px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
        <h1 className="font-medium text-xl mb-8">
          <i className="fi fi-rr-user"></i> Users related to search
        </h1>

        <UserCardWrapper />
      </div>
    </section>
  );
};

export default SearchPage;
