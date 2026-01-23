import React, { useEffect, useState } from "react";
import api from "../services/api";

const TestBackend = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/api/test/")
      .then(res => setMessage(res.data.message))
      .catch(err => console.error(err));
  }, []);

  return <h2>{message}</h2>;
};

export default TestBackend;
