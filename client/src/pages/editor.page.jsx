import { useContext, useState, createContext } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../App";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";

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
  const [editorState, setEditorState] = useState("editor");
  const [blog, setBlog] = useState(blogStructure);

  const {
    userAuth: { jwtToken },
  } = useContext(UserContext);

  if (!jwtToken) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <EditorContext.Provider
      value={{ blog, setBlog, editorState, setEditorState }}
    >
      {editorState === "editor" ? <BlogEditor /> : <PublishForm />}
    </EditorContext.Provider>
  );
};

export default Editor;
