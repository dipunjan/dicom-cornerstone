import { Link } from "react-router-dom";

export const Home = () => {
  return (
    <div className="home-container">
      <h1 className="home-title">CSOI Application</h1>
      <p className="home-description">Choose Patient:</p>

      <div className="home-buttons">
        <button className="home-button">
          <Link to="patient/P001/fileviewer" className="home-button-link">
            John Doe
          </Link>
        </button>
      </div>
    </div>
  );
};
