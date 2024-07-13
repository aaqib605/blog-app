import { useContext, useState, createContext, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { UserContext } from "../App";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import Loader from "../components/loader.component";
import axios from "axios";

const blogStructure = {
  title: "",
  banner: "",
  content: [],
  tags: [],
  description: "",
  author: { personalInfo: {} },
};

export const EditorContext = createContext({});

const Editor = () => {
  const { blogId } = useParams();
  const [blog, setBlog] = useState(blogStructure);
  const [editorState, setEditorState] = useState("editor");
  const [textEditor, setTextEditor] = useState({ isReady: false });
  const [loading, setLoading] = useState(true);

  const {
    userAuth: { jwtToken },
  } = useContext(UserContext);

  if (!jwtToken) {
    return <Navigate to="/signin" replace />;
  }

  useEffect(() => {
    const fetchBlog = async (req, res) => {
      if (!blogId) {
        return setLoading(false);
      }

      try {
        const {
          data: { blog },
        } = await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-blog`, {
          blogId,
          draft: true,
          mode: "edit",
        });

        setBlog(blog);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setBlog(null);
        setLoading(false);
      }
    };

    fetchBlog();
  }, []);

  return (
    <EditorContext.Provider
      value={{
        blog,
        setBlog,
        editorState,
        setEditorState,
        textEditor,
        setTextEditor,
      }}
    >
      {loading ? (
        <Loader />
      ) : editorState === "editor" ? (
        <BlogEditor />
      ) : (
        <PublishForm />
      )}
    </EditorContext.Provider>
  );
};

export default Editor;
