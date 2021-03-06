import React from "react";
import { fetchPiData } from "../api/piData";
import Sniff from "../components/pisniff";
import moment from "moment";
import Header from '../components/header';
import Main from "../components/mainDashboard";
import Vision from "../components/pivision";
import About from "../components/about";
import { Switch, Route, Redirect } from 'react-router-dom';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      fileContent: [],
      error: false,
      errorMessage: "",
      rawFrameToggle: false,
      numberOfLines: "",
      isNavOpen: false,
      piDataFileRequestName: moment().toDate() //"2020-02-04T15:30:00.000Z" //convert this to utc while sending the request
    };


  }




  async componentDidMount() {
    try {
      this.props.socket.on("newData", this.socketDataCallback);
      // const response = await fetchPiData("2020-02-04T15:30:00.000Z");
      let fileName = moment(this.state.piDataFileRequestName)
        .startOf("day")
        .toISOString();
      const response = await fetchPiData(fileName);
      let fileContent = response.data.fileContent
        ? response.data.fileContent
        : [];
      fileContent = fileContent.map(element => {
        return JSON.parse(element);
      });
      this.setState({
        fileContent,
        isLoading: false,
        error: false,
        errorMessage: ""
      });
    } catch (error) {
      // console.log(error);
      this.setState({
        error: true,
        errorMessage: error.response.data.error
          ? error.response.data.error
          : error.message,
        isLoading: false
      });
    }
  }

  async componentWillUnmount() {
    //remove the event handlers on the socket, because this will also be used by other components?
    this.props.socket.removeAllListeners("newData");
  }

  async _fetchPiData(date, numberOfLines) {
    try {
      const response = await fetchPiData(
        moment(date)
          .startOf("day")
          .toISOString(),
        numberOfLines
      );
      let fileContent = response.data.fileContent
        ? response.data.fileContent
        : [];
      fileContent = fileContent.map(element => {
        return JSON.parse(element);
      });
      this.setState({
        fileContent,
        isLoading: false,
        error: false,
        errorMessage: ""
      });
    } catch (error) {
      // console.log(error);
      this.setState({
        fileContent: [],
        error: true,
        errorMessage: error.response.data.error
          ? error.response.data.error
          : error.message,
        isLoading: false
      });
    }
  }

  toggleNav() {
    this.setState({
      isNavOpen: !this.state.isNavOpen
    });
  }

  rawFrameToggleHandler = (event) => {
    event.preventDefault();
    this.setState({ rawFrameToggle: !this.state.rawFrameToggle });
  };

  datePickerHandler = date => {
    let numberOfLines = this.state.numberOfLines;
    // console.log(moment(date).toISOString());
    if (!!date) {
      this.setState({ piDataFileRequestName: date, isLoading: true }, () =>
        this._fetchPiData(date, numberOfLines)
      );
    }
  };

  handleMessageDismiss = () => {
    this.setState({ error: false, errorMessage: "" });
  };

  socketDataCallback = data => {
    // console.log(data);
    //append the incoming new data on the socket to the existing state which will then re render the component with the new state
    if (
      moment(data.timestamp, "YYYY-MM-DDTHH:mm:ssZ")
        .startOf("day")
        .isSame(moment(this.state.piDataFileRequestName).startOf("day"))
    ) {
      this.setState({
        fileContent: [...this.state.fileContent, data],
        error: false,
        errorMessage: ""
      });
    }
  };

  render() {
    const SniffPage = () => {
      return (
        <Sniff
          isLoading={this.state.isLoading}
          fileContent={this.state.fileContent}
          rawFrameToggle={this.state.rawFrameToggle}
          error={this.state.error}
          errorMessage={this.state.errorMessage}
          piDataFileRequestName={this.state.piDataFileRequestName}
          rawFrameToggleHandler={this.rawFrameToggleHandler}
          datePickerHandler={this.datePickerHandler}
          handleMessageDismiss={this.handleMessageDismiss}
          toggleNav={this.toggleNav}
        />
      );
    }
    const MainPage = () => {
      return (
        <Main />
      );
    }
    const VisionPage = () => {
      return (
        <Vision />
      );
    }
    const AboutPage = () => {
      return (
        <About />
      );
    }
    return (

      <div>
        <Header
          piDataFileRequestName={this.state.piDataFileRequestName}
          rawFrameToggleHandler={this.rawFrameToggleHandler}
          datePickerHandler={this.datePickerHandler}
        />
        <Switch>
          <Route exact path='/pisniff' component={SniffPage} />
          <Route exact path='/pivision' component={VisionPage} />
          <Route exact path='/about' component={AboutPage} />
          <Route path='/home' component={MainPage} />
          <Redirect to="/home" />
        </Switch>

      </div>
    );
  }
}

export default Dashboard;
