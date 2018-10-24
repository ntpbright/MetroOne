import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { Location, Permissions, Notifications } from 'expo';
import { MapView } from 'expo';

import * as firebase from 'firebase'

const timer = require('react-native-timer');

const config = {
  apiKey: "AIzaSyDHVl6r3cB3amGvgbc8tBT_grOa6ZJCeVk",
  authDomain: "metroone-a5304.firebaseapp.com",
  databaseURL: "https://metroone-a5304.firebaseio.com",
  projectId: "metroone-a5304",
  storageBucket: "metroone-a5304.appspot.com",
  messagingSenderId: "941565045301"
}
firebase.initializeApp(config)

export default class App extends Component {

  constructor(){
    super()
    this.BETWEEN_DEGREE = 15.00;
    this.THOUSAND_METER = 1000;
    this.SURFACE_DISTANCE_PER_ONE_DEGREE = [
      { latitude : 110.574, longitude : 111.320 }, //0  degree
      { latitude : 110.649, longitude : 107.551 }, //15 degree
      { latitude : 110.852, longitude : 96.486 },  //30 degree
      { latitude : 111.132, longitude : 78.847 },  //45 degree
      { latitude : 111.412, longitude : 55.800 },  //60 degree
      { latitude : 111.618, longitude : 28.902 },  //75 degree
      { latitude : 111.694, longitude : 0.000 }    //90 degree
   ];
  }

  state = {
    region: { latitude: null, longitude: null},
    coord: { latitude:13.789262, longitude:100.579949 },
    real_location: { latitude:13.789262, longitude:100.579949 },
    location: null,
    errorMessage: null,
    distance: null,
    radius: 20,
    status: null,
  };

  testPushNotification = async () => {
    let { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS)

    if (status !== 'granted') {
      return;
    }

    let token = await Notifications.getExpoPushTokenAsync()
    console.log(token)
    firebase.database().ref('/users').set({token: token})
  }


  getSurfaceDistance(location){
    return this.SURFACE_DISTANCE_PER_ONE_DEGREE[parseInt(location.latitude / this.BETWEEN_DEGREE)]; //depend on latitude
  }

  getLatitudeDistance(location){
    return this.getSurfaceDistance(location).latitude * this.THOUSAND_METER;
  }

  getLongitudeDistance(location){
    return this.getSurfaceDistance(location).longitude * this.THOUSAND_METER;
  }

  componentWillMount = async () => {
    // this.setRegion()
    console.log("Will Mount")
    await this._getLocationAsync()
    await console.log(this.state.location)
  }

  componentDidMount() {
    this.testPushNotification()
    console.log("Did Mount")
    timer.setInterval('UpdateGPSInterval', () => {
      console.log("Interval"),
      this.updateLocation(),
      this.findDistance(),
      this.checkStatus(),
      console.log(this.state.real_location),
      console.log(this.state.distance)
    }, 5000);
  }

  setRegion(){
    // let region = this.state.
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
  };

  updateLocation = async() => {
    let location = await Location.getCurrentPositionAsync({});
    let real_location = {}
    this.setState({ location });
    if (this.state.errorMessage) {
      text = this.state.errorMessage;
    } else if (this.state.location) {
      real_location.latitude = this.state.location.coords.latitude
      real_location.longitude = this.state.location.coords.longitude
    }
    this.setState({real_location})
    console.log("Update location")
  }

  findDistance(){
    var latitudeDistance1 = this.getLatitudeDistance(this.state.real_location); //a1
    var latitudeDistance2 = this.getLatitudeDistance(this.state.coord); //a2
    var longitudeDistance1 = this.getLongitudeDistance(this.state.real_location); //b1
    var longitudeDistance2 = this.getLongitudeDistance(this.state.coord); //b2
    // (X2 * a2 - X1 * a1) ^ 2
    var power1 = Math.pow((this.state.coord.latitude * latitudeDistance2) - (this.state.real_location.latitude * latitudeDistance1), 2);
    // (Y2 * b2 - Y1 * b1) ^ 2
    var power2 = Math.pow((this.state.coord.longitude * longitudeDistance2) - (this.state.real_location.longitude * longitudeDistance1), 2);
    let distance = Math.sqrt(power1 + power2);
    this.setState({ distance })
    console.log("Find Distance")
  };

  checkStatus(){
    if(this.state.distance <= this.state.radius){
      this.setState({status : true})
    } else{
      this.setState({status : false})
    }
  }

  render() {
    // return (
    //   <Text>
    //     Test
    //   </Text>
    // )
    return (
      <MapView
        style={{ flex: 1 }}
        region={{
          ...this.state.real_location,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        }}
      >
        <View
          style={{
            height: 100,
            backgroundColor: `${ this.state.status ? "#467f00" : "#f44242" }`
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: 26,
              paddingTop: 40,
              paddingBottom: 30,
              color: "white",
            }}
          >
            { this.state.distance }
          </Text>
        </View>
        <MapView.Marker
          key={1}
          coordinate={{...this.state.real_location,}}
          title={"real_location"}
        />
        <MapView.Marker
          key={2}
          coordinate={{...this.state.coord,}}
          title={"Coord"}
        />
        <MapView.Circle
          key={3}
          center={{...this.state.coord,}}
          radius= { this.state.radius }
          fillColor="rgba(0, 141, 206, 0.2)"
          strokeColor="rgba(0, 141, 206, 0.4)"
        />
      </MapView>
    );
  }
}