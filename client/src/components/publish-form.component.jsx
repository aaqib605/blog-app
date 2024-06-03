import { useContext } from "react";
import { Toaster, toast } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { EditorContext } from "../pages/editor.page";
import Tag from "./tags.component";

const PublishForm = () => {
  const characterLimit = 200;
  const tagsLimit = 10;

  const {
    blog: { banner, title, description, tags },
    setBlog,
    setEditorState,
  } = useContext(EditorContext);
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
              return <Tag key={i} tag={tag} tagIndex={i} />;
            })}
          </div>

          <p className="mt-1 text-dark-grey text-sm text-right">
            {tagsLimit - tags.length} tags left
          </p>

          <button className="btn-dark px-8">Publish</button>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default PublishForm;
