import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../App";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";

const Editor = () => {
  const [editorState, setEditorState] = useState("editor");

  const {
    userAuth: { jwtToken },
  } = useContext(UserContext);

  if (!jwtToken) {
    return <Navigate to="/signin" replace />;
  }

  return editorState === "editor" ? <BlogEditor /> : <PublishForm />;
};

export default Editor;
