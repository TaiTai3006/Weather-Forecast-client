import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import axios from "axios";
import Modal from "react-bootstrap/Modal";

const App = () => {
  const getCookie = (name) => {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => {
    if (userData.status === 0) {
      setShow(true);
    } else {
      handleUnsubcribe();
    }
  };

  const searchHistoryCookies = JSON.parse(getCookie("searchHistory"));

  const weatherInfoDataLocalStorage = JSON.parse(
    localStorage.getItem("WeatherInfoNow")
  );

  const userDataLocalStorage = JSON.parse(localStorage.getItem("user"));

  const [userData, setUserData] = useState(
    userDataLocalStorage
      ? userDataLocalStorage
      : { gmail: "", location: "", status: 0 }
  );

  const [weatherData, setWeatherData] = useState(
    weatherInfoDataLocalStorage ? weatherInfoDataLocalStorage : []
  );
  const [location, setLocation] = useState("tokyo");

  const [searchHistory, setSearchHistory] = useState(
    searchHistoryCookies ? searchHistoryCookies : []
  );

  const [inputEmail, setInputEmail] = useState("");

  const handleUnsubcribe = () => {
    axios
      .post("https://taitai3006.pythonanywhere.com/logout/", {
        gmail: userData.gmail,
      })
      .then(function (response) {
        setUserData((prData) => response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
      });
  };

  const handleSubcribe = (e) => {
    e.preventDefault();
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        axios
          .post("https://taitai3006.pythonanywhere.com/register/", {
            gmail: inputEmail,
            location: `${latitude},${longitude}`,
          })
          .then(function (response) {
            setUserData((prData) => response.data);
            localStorage.setItem("user", JSON.stringify(response.data));
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    );
    setShow(false);
  };

  useEffect(() => {
    setSearchHistory(JSON.parse(getCookie("searchHistory")));
  }, [weatherData]);

  const setCookie = (name, value) => {
    var expires = "";

    var date = new Date();
    date.setTime(date.getTime() + 1 * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();

    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  };

  const addSearchHistory = (value) => {
    console.log(value);
    let cookieValue = JSON.parse(getCookie("searchHistory"));
    let arr = cookieValue ? cookieValue : [];

    setCookie("searchHistory", JSON.stringify([...new Set([...arr, value])]));
  };

  const handleChange = (event, newValue) => {
    setLocation(newValue);
  };

  const handleInputChange = (event, newInputValue) => {
    setLocation(newInputValue);
  };

  const handleSearch = () => {
    fetchWeatherData(location);
  };

  const handleCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        fetchWeatherData(`${latitude},${longitude}`);
      },
      (error) => {
        fetchLocationByIP();
      }
    );
  };

  const fetchLocationByIP = async () => {
    try {
      const response = await axios.get(`https://taitai3006.pythonanywhere.com/getLocationByIP`);
      fetchWeatherData(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchWeatherData = async (location) => {
    const cookieValue = JSON.parse(getCookie(location));

    if (cookieValue) {
      setWeatherData(cookieValue);
      return 0;
    }

    try {
      const response = await axios.get(
        `https://taitai3006.pythonanywhere.com/getWeatherInfo/?q=${location}`
      );

      const data = {
        name: response.data.location.name,
        date: response.data.forecast.forecastday[0].date,
        forecastday: response.data.forecast.forecastday.map(
          ({ day, date }) => ({ day, date })
        ),
      };

      console.log(data);

      setWeatherData(data);
      setLocation(data.name);

      localStorage.setItem("WeatherInfoNow", JSON.stringify(data));
      setCookie(location, JSON.stringify(data));
      addSearchHistory(location);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    !weatherData && fetchWeatherData(location);
  }, []);

  console.log(location);

  return (
    <div>
      <div className="header">
        <h1>Weather Dashboard</h1>
      </div>

      <div className="row">
        <div className="col box">
          <h5 className="fw-bold">Enter a City Name</h5>
          <Stack>
            <Autocomplete
              freeSolo
              id="free-solo-2-demo"
              disableClearable
              options={
                searchHistory ? searchHistory.map((option) => option) : []
              }
              onChange={handleChange}
              onInputChange={handleInputChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="E.g., New York, London, Tokyo"
                  InputProps={{
                    ...params.InputProps,
                    type: "search",
                  }}
                />
              )}
            />
          </Stack>
          <button
            type="button"
            onClick={handleSearch}
            className="btn btn-primary mt-4 py-2"
          >
            Search
          </button>
          <div className="d-flex align-items-center my-2">
            <div className="flex-grow-1 border-bottom border-2"></div>
            <div className="mx-3 text-muted">or</div>
            <div className="flex-grow-1 border-bottom border-2"></div>
          </div>
          <button
            style={{ backgroundColor: "#6C757D" }}
            type="button"
            onClick={handleCurrentLocation}
            className="btn btn-primary py-2"
          >
            Use Current Location
          </button>
          <div className="my-4">
            <p>
              {userData.status === 0
                ? "** Click the subscribe button to receive weather information."
                : `Hi, ${userData.gmail}.`}
            </p>
            <button
              style={{
                backgroundColor: userData.status === 0 ? "red" : "#6C757D",
              }}
              type="button"
              data-toggle="modal"
              onClick={handleShow}
              className="btn btn-danger py-2"
            >
              {userData.status === 0 ? "Subscribe" : "Unsubscribe"}
            </button>
          </div>
        </div>
        <div className="col-lg-8 col-11 box">
          {weatherData &&
          weatherData?.forecastday &&
          weatherData?.forecastday.length > 0 ? (
            <>
              <div
                style={{ background: "#5372F0" }}
                className="p-4 rounded d-flex justify-content-between align-items-center"
              >
                <div className="text-light">
                  <h4 className="fw-bold">
                    {weatherData.name} ({weatherData.date})
                  </h4>
                  <div className="mt-2">
                    Temperature: {weatherData.forecastday[0].day.avgtemp_c}
                    &deg;C
                  </div>
                  <div className="mt-2">
                    Wind: {weatherData.forecastday[0].day.avgvis_miles}
                    M/S
                  </div>
                  <div className="mt-2">
                    Humidity: {weatherData.forecastday[0].day.avghumidity}%
                  </div>
                </div>
                <div className="img-wheather-contrainer">
                  <img
                    src={`https:${weatherData.forecastday[0].day.condition.icon}`}
                    alt={weatherData.forecastday[0].day.condition}
                    className="img-wheather"
                  />
                  <p className="text-light">
                    {weatherData.forecastday[0].day.condition.text}
                  </p>
                </div>
              </div>
              <h4 className="my-4 fw-bold">4-Day Forecast</h4>
              <div className="row ">
                {weatherData?.forecastday?.slice(1)?.map((data, index) => (
                  <div
                    key={index}
                    className="col p-4 m-1 text-light rounded"
                    style={{ backgroundColor: "#6C757D" }}
                  >
                    <h4 className="fw-bold">({data.date})</h4>
                    <img
                      src={`https:${data.day.condition.icon}`}
                      alt={data.day.condition.text}
                      className="img-wheather-small"
                    />
                    <div className="mt-2">Temp: {data.day.avgtemp_c}&deg;C</div>
                    <div className="mt-2">
                      Wind: {data.day.avgvis_miles} M/S
                    </div>
                    <div className="mt-2">
                      Humidity: {data.day.avghumidity}%
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Enter email to subscribe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <div class="form-group">
              <label for="exampleInputEmail1">Email address</label>
              <input
                type="email"
                class="form-control"
                id="exampleInputEmail1"
                aria-describedby="emailHelp"
                placeholder="Enter email"
                onChange={(e) => setInputEmail(e.target.value)}
                required
              />
            </div>
            <div class="form-check my-3">
              <input
                type="checkbox"
                class="form-check-input"
                id="exampleCheck1"
                required
              />
              <label class="form-check-label" for="exampleCheck1">
                Permission to use your location
              </label>
            </div>
            <button
              type="submit"
              class="btn btn-primary"
              onClick={(e) => handleSubcribe(e)}
            >
              Submit
            </button>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default App;
