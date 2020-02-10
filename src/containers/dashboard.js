import React from "react";
import { fetchPiData } from "../api/piData";
import DashboardComponent from "../components/dashboard";
import moment from "moment";

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      fileContent: [],
      error: false,
      errorMessage: "",
      rawFrameToggle: false,
      piDataFileRequestName: moment().toDate() //"2020-02-04T15:30:00.000Z" //convert this to utc while sending the request
    };
  }

  async componentDidMount() {
    try {
      this.props.socket.on("newData", this.socketDataCallback);
      // const response = await fetchPiData("2020-02-04T15:30:00.000Z");
      let fileName = moment(this.state.piDataFileRequestName)
        .startOf("hour")
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

  async _fetchPiData(date) {
    try {
      const response = await fetchPiData(
        moment(date)
          .startOf("hour")
          .toISOString()
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

  rawFrameToggleHandler = (event, object) => {
    event.preventDefault();
    this.setState({ rawFrameToggle: object.checked });
  };

  datePickerHandler = date => {
    // console.log(moment(date).toISOString());
    if (!!date) {
      this.setState({ piDataFileRequestName: date, isLoading: true }, () =>
        this._fetchPiData(date)
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
        .startOf("hour")
        .isSame(moment(this.state.piDataFileRequestName).startOf("hour"))
    ) {
      this.setState({ fileContent: [...this.state.fileContent, data] });
    }
  };

  render() {
    return (
      <DashboardComponent
        isLoading={this.state.isLoading}
        fileContent={this.state.fileContent}
        rawFrameToggle={this.state.rawFrameToggle}
        error={this.state.error}
        errorMessage={this.state.errorMessage}
        piDataFileRequestName={this.state.piDataFileRequestName}
        rawFrameToggleHandler={this.rawFrameToggleHandler}
        datePickerHandler={this.datePickerHandler}
        handleMessageDismiss={this.handleMessageDismiss}
      />
    );
  }
}

export default Dashboard;