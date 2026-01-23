import api from "../services/api";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/api/profile/")
      .then(res => setUser(res.data))
      .catch(() => alert("Unauthorized"));
  }, []);

  return <h1>{user?.username}</h1>;
};

export default Dashboard;

