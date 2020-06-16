// React
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  HashRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";
import { ToastContainer, Slide } from 'react-toastify';

// Firebase
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

// styles
import './styles/App.css';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Header from './Components/Header';
import Home from './Components/Home';
import Games from './Components/Games';
import OngoingGame from './Components/OngoingGame';
import NewGame from './Components/NewGame';
import Stats from './Components/Stats';
import Teams from './Components/Teams';

// helper functions
import { sortTeams } from './Utils/utils';

const firebaseConfig = {
  apiKey: "AIzaSyBqJvH9x13wUFJhaBjCqkxUPesQ7Fm0YXg",
  authDomain: "ultimate-stats-3bdf2.firebaseapp.com",
  databaseURL: "https://ultimate-stats-3bdf2.firebaseio.com",
  projectId: "ultimate-stats-3bdf2",
  storageBucket: "ultimate-stats-3bdf2.appspot.com",
  messagingSenderId: "499792401385",
  appId: "1:499792401385:web:2336eacc08c88a3fb8b178",
  measurementId: "G-ZSK5SCD0YF"
};

const uiConfig = {
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
  ],
  'credentialHelper': 'none',
  'signInFlow': 'popup'
}

// Instantiate a Firebase app and database
const firebaseApp = firebase.initializeApp(firebaseConfig);
export const db = firebaseApp.firestore();

function App() {

  // set state (global)
  const [currentGame, setCurrentGame] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [gameOptions, setGameOptions] = useState({
    statTeam: '',
    jerseyColour: 'Light',
    startingOn: 'Offence',
    opponent: '',
    gameFormat: { value: 7, label: `7 v 7` },
  });
  const [teamOptions, setTeamOptions] = useState([]);
  const [user, setUser] = useState(null);

  // store ref of gameOptions
  let gameOptionsRef = useRef(gameOptions);

  const loadUser = useCallback(() => {
    // get the user from the db and load into state
    db.collection('users').where('uid', '==', user.uid)
      .get()
      .then(res => {
        res.forEach(doc => {
          setDbUser(doc.data());
          console.log('User fetched')
          // set the possible team options from the db
          let newTeamOptions = [];
          for (let team of Object.values(doc.data().teams)) {
            newTeamOptions.push({ value: team.name, label: team.name, teamID: team.teamID });
          };
          newTeamOptions.sort((a, b) => {
            return sortTeams(a.value, b.value)
          });
          setTeamOptions(newTeamOptions);
          let newGameOptions = { ...gameOptionsRef.current };
          newGameOptions.statTeam = newTeamOptions[0];
          setGameOptions(gameOptions => newGameOptions);
          console.log('Team Options Set');
        });
      })
      .catch(error => console.log('Error loading User', error))
  }, [user]);

  useEffect(() => {
    // set the unsaved game if there is one
    setCurrentGame(JSON.parse(localStorage.getItem('currentGame')) || null);
    // listen for auth state changes
    const unsubscribe = firebaseApp.auth().onAuthStateChanged(user => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);;
        console.log(user);
      } else {
        localStorage.removeItem('user');
        setUser(user);
        localStorage.removeItem('currentGame');
        setCurrentGame(null);
      }
    })
    // unsubscribe to the listener when unmounting
    return () => unsubscribe()
  }, []);

  useEffect(() => {
    if (user) {
      loadUser();
    }
  }, [user, loadUser]);

  useEffect(() => {
    if (currentGame) {
      localStorage.setItem('currentGame', JSON.stringify(currentGame));
    }
  }, [currentGame]);

  const resetTeamOptions = (newTeams) => {
    let newTeamOptions = [];
    for (let team of Object.values(newTeams)) {
      newTeamOptions.push({ value: team.name, label: team.name, teamID: team.teamID });
    };
    newTeamOptions.sort((a, b) => {
      return sortTeams(a.value, b.value)
    });
    setTeamOptions(newTeamOptions);
    let newGameOptions = { ...gameOptionsRef.current };
    newGameOptions.statTeam = newTeamOptions[0];
    setGameOptions(newGameOptions);
  }

  return (
    <Router>
      <ToastContainer
        autoClose={2000}
        hideProgressBar
        position='top-center'
        transition={Slide}
      />
      <Switch>
        <Route path='/' exact>
          <Header
            firebaseApp={firebaseApp}
            user={user}
          />
          <Home
            firebaseApp={firebaseApp}
            uiConfig={uiConfig}
          />
          <OngoingGame
            currentGame={currentGame}
            setCurrentGame={setCurrentGame}
          />
        </Route>
        <Route path='/teams' exact>
          {localStorage.getItem('user') ?
            <>
              <Header
                firebaseApp={firebaseApp}
                user={user}
              />
              <Teams
                db={db}
                dbUser={dbUser}
                resetTeamOptions={resetTeamOptions}
                setDbUser={setDbUser}
              />
              <OngoingGame
                currentGame={currentGame}
                setCurrentGame={setCurrentGame}
              />
            </> : <Redirect to='/' />
          }
        </Route>
        <Route path='/games' exact>
          {localStorage.getItem('user') ?
            <>
              <Header
                firebaseApp={firebaseApp}
                user={user}
              />
              <Games
                db={db}
                dbUser={dbUser}
              />
              <OngoingGame
                currentGame={currentGame}
                setCurrentGame={setCurrentGame}
              />
            </> : <Redirect to='/' />
          }
        </Route>
        <Route path='/newgame' exact>
          {localStorage.getItem('user') ?
            <>
              <Header
                firebaseApp={firebaseApp}
                user={user}
              />
              <NewGame
                currentGame={currentGame}
                db={db}
                dbUser={dbUser}
                gameOptions={gameOptions}
                setCurrentGame={setCurrentGame}
                setDbUser={setDbUser}
                setGameOptions={setGameOptions}
                teamOptions={teamOptions}
              />
            </> : <Redirect to='/' />
          }
        </Route>
        <Route path='/stats' exact>
          {currentGame ?
            <>
              <Header
                firebaseApp={firebaseApp}
                user={user}
              />
              <Stats
                db={db}
                dbUser={dbUser}
                currentGame={currentGame}
              />
            </> : <Redirect to='/newgame' />
          }
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
