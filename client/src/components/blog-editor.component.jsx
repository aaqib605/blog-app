import { useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import logo from "../imgs/logo.png";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import { uploadImage } from "../common/aws";
import { EditorContext } from "../pages/editor.page";
import { UserContext } from "../App";

const BlogEditor = () => {
  const {
    blog,
    blog: { title, banner, content, description, tags },
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
  } = useContext(EditorContext);

  const {
    userAuth: { jwtToken },
  } = useContext(UserContext);

  const navigate = useNavigate();

  const handleBannerUpload = async (e) => {
    let img = e.target.files[0];

    try {
      if (img) {
        const loadingToast = toast.loading("Uploading Image");
        const uploadedImg = await uploadImage(img);

        if (uploadedImg) {
          toast.dismiss(loadingToast);
          toast.success("Image uploaded 🎉");

          setBlog((prevState) => {
            return {
              ...prevState,
              banner: uploadedImg,
            };
          });
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error uploading image");
    }
  };

  const handleTitleKeyDown = (e) => {
    // prevent new line
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  };

  const handleTitleChange = (e) => {
    const input = e.target;

    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;

    setBlog((prevState) => {
      return {
        ...prevState,
        title: input.value,
      };
    });
  };

  const handleImageError = (e) => {
    const img = e.target;

    img.src = `${defaultBanner}`;
  };

  const handlePublishEvent = async (e) => {
    try {
      if (!banner.length) {
        return toast.error("Upload blog banner to proceed.");
      }

      if (!title.length) {
        return toast.error("Blog title is required to publish the blog.");
      }

      if (textEditor.isReady) {
        const data = await textEditor.save();

        if (data.blocks.length) {
          setBlog((prevState) => {
            return {
              ...prevState,
              content: data,
            };
          });
          setEditorState("publish");
        } else {
          return toast.error("Blog content is required to publish the blog.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error publishing the blog, try again.");
    }
  };

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }

    if (!title.length) {
      return toast.error("Blog title is required for saving the draft.");
    }

    let loadingToast = toast.loading("Saving Draft...");

    e.target.classList.add("disable");

    if (textEditor.isReady) {
      textEditor.save().then((content) => {
        const blogObj = {
          title,
          banner,
          description,
          content,
          tags,
          draft: true,
        };

        axios
          .post(`${import.meta.env.VITE_SERVER_DOMAIN}/create-blog`, blogObj, {
            headers: {
              Authorization: `Bearer ${jwtToken}`,
            },
          })
          .then(() => {
            e.target.classList.remove("disable");

            toast.dismiss(loadingToast);
            toast.success("Draft saved 🎉");

            setTimeout(() => {
              navigate("/");
            }, 500);
          })
          .catch(({ response }) => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);

            return toast.error(response.data.error);
          });
      });
    }
  };

  useEffect(() => {
    setTextEditor(
      new EditorJS({
        holderId: "textEditor",
        data: content,
        tools,
        placeholder: "Let's write an awesome story",
      })
    );
  }, []);

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="logo" />
        </Link>

        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublishEvent}>
            Publish
          </button>
          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </nav>

      <Toaster />

      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w[900px] w-full">
            <div className="relative aspect-video bg-white border-4 border-grey hover:opacity-80">
              <label htmlFor="uploadBanner">
                <img
                  src={banner}
                  onError={handleImageError}
                  alt="Blog Banner"
                  className="z-20"
                />
                <input
                  type="file"
                  id="uploadBanner"
                  accept=".png, .jpg, .jpeg"
                  onChange={handleBannerUpload}
                  hidden
                />
              </label>
            </div>

            <textarea
              value={title}
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5" />

            <div id="textEditor" className="font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
