import { useContext } from "react";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import { EditorContext } from "../pages/editor.page";
import Tag from "./tags.component";
import { UserContext } from "../App";

const PublishForm = () => {
  const characterLimit = 200;
  const tagsLimit = 10;

  const { blogId } = useParams();

  const {
    blog: { banner, title, description, tags, content },
    setBlog,
    setEditorState,
  } = useContext(EditorContext);

  const {
    userAuth: { jwtToken },
  } = useContext(UserContext);

  const navigate = useNavigate();

  const handleCloseEvent = () => {
    setEditorState("editor");
  };

  const handleTitleChange = (e) => {
    setBlog((prevState) => {
      return {
        ...prevState,
        title: e.target.value,
      };
    });
  };

  const handleDescriptionChange = (e) => {
    setBlog((prevState) => {
      return {
        ...prevState,
        description: e.target.value,
      };
    });
  };

  const handleDescriptionKeyDown = (e) => {
    // prevent new line
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  };

  const handleTagsKeyDown = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();

      const tag = e.target.value;

      if (tags.length < tagsLimit) {
        if (!tags.includes(tag) && tag.length) {
          setBlog((prevState) => {
            return {
              ...prevState,
              tags: [...tags, tag],
            };
          });
        }
      } else {
        toast.error(`Tags limit (${tagsLimit}) exceeded.`);
      }

      e.target.value = "";
    }
  };

  const publishBlog = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }

    if (!title.length) {
      return toast.error("Blog title is required for publishing the blog.");
    }

    if (!description.length || description.length > characterLimit) {
      return toast.error(
        `Blog description (max ${characterLimit} characters) is required for publishing the blog.`
      );
    }

    if (!tags.length) {
      return toast.error("Enter atleast one tag to help us rank your blog.");
    }

    let loadingToast = toast.loading("Publishing...");

    e.target.classList.add("disable");

    const blogObj = {
      title,
      banner,
      description,
      content,
      tags,
      draft: false,
    };

    axios
      .post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/create-blog`,
        { ...blogObj, id: blogId },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        }
      )
      .then(() => {
        e.target.classList.remove("disable");

        toast.dismiss(loadingToast);
        toast.success("Blog published 🎉");

        setTimeout(() => {
          navigate("/");
        }, 500);
      })
      .catch(({ response }) => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);

        return toast.error(response.data.error);
      });
  };

  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
        <Toaster />

        <button
          className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
          onClick={handleCloseEvent}
        >
          <i className="fi fi-br-cross"></i>
        </button>

        <div className="max-w-[550px] center">
          <p className="text-dark-grey mb-1">Preview</p>

          <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
            <img src={banner} alt="Blog Banner" />
          </div>

          <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">
            {title}
          </h1>

          <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">
            {description}
          </p>
        </div>

        <div className="border-grey lg:border-1 lg:pl-8">
          <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
          <input
            className="input-box pl-4"
            type="text"
            placeholder="Blog Title"
            value={title}
            onChange={handleTitleChange}
          />

          <p className="text-dark-grey mb-2 mt-9">Blog Description</p>

          <textarea
            className="h-40 resize-none leading-7 input-box pl-4"
            maxLength={characterLimit}
            value={description}
            onChange={handleDescriptionChange}
            onKeyDown={handleDescriptionKeyDown}
          ></textarea>

          <p className="mt-1 text-dark-grey text-sm text-right">
            {characterLimit - description.length} characters left
          </p>

          <p className="text-dark-grey mb-2 mt-9">
            Tags - (Helps in searching and ranking your blog post)
          </p>

          <div className="relative input-box pl-2 py-2 pb-4">
            <input
              className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white placeholder:opacity-40"
              type="text"
              placeholder="Enter tag"
              onKeyDown={handleTagsKeyDown}
            />

            {tags.map((tag, i) => {
              return <Tag key={i} tag={tag} />;
            })}
          </div>

          <p className="mt-1 text-dark-grey text-sm text-right">
            {tagsLimit - tags.length} tags left
          </p>

          <button className="btn-dark px-8" onClick={publishBlog}>
            Publish
          </button>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
