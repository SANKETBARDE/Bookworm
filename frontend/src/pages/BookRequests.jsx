import { useEffect, useState } from "react";
import api from "../services/api";

function BookRequests() {
  const [requests, setRequests] = useState([]);

  const [form, setForm] = useState({
    title: "",
    author: "",
    language: "English",
    description: "",
    external_link: "",
  });

  const fetchRequests = async () => {
    try {
      const response = await api.get("/book-requests/my");
      setRequests(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const submitRequest = async (e) => {
    e.preventDefault();

    try {
      await api.post("/book-requests", form);

      setForm({
        title: "",
        author: "",
        language: "English",
        description: "",
        external_link: "",
      });

      fetchRequests();
      alert("Book request submitted");
    } catch (error) {
      alert(error.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="page">
      <div className="form-page">
        <h1>Request a Book</h1>

        <form className="form-card" onSubmit={submitRequest}>
          <input
            type="text"
            name="title"
            placeholder="Book Title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="author"
            placeholder="Author"
            value={form.author}
            onChange={handleChange}
          />

          <select name="language" value={form.language} onChange={handleChange}>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Kannada">Kannada</option>
            <option value="Marathi">Marathi</option>
          </select>

          <textarea
            name="description"
            placeholder="Why do you need this book?"
            value={form.description}
            onChange={handleChange}
          />

          <input
            type="text"
            name="external_link"
            placeholder="Optional reference link"
            value={form.external_link}
            onChange={handleChange}
          />

          <button className="btn primary">Submit Request</button>
        </form>
      </div>

      <section className="section">
        <h2>My Requests</h2>

        <div className="list">
          {requests.map((req) => (
            <div className="list-card" key={req.id}>
              <h3>{req.title}</h3>
              <p>{req.author}</p>
              <p>Status: <span className={`status ${req.status}`}>{req.status}</span></p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default BookRequests;