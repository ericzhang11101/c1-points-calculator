import React, {useState} from 'react'
import './App.css'; 
import {TextField, Alert, AlertTitle, Button} from '@mui/material'
import { tryCalculation } from './utils/calculator.js';
import PointDisplay from './PointDisplay';

export default function App() {
  const [textInput, setTextInput] = useState("")
  const [pointResult, setPointResult] = useState({})
  const [shouldDisplayAlert, setShouldDisplayAlert] = useState(false)
  const [errorText, setErrorText] = useState("");
  
  function handleChange(e){
    setTextInput(e.target.value)
    setShouldDisplayAlert(false)
  }

  async function submitForm(){
    setPointResult({})
    const data = await tryCalculation(textInput)
    if (data.success){
      setPointResult(data)
      console.log(data)
    }
    else {
      handleAlert(data.error)
    }
    
  }

  function handleAlert(error){
    setShouldDisplayAlert(true);
    setErrorText(error.toString())
    setTimeout(() => {
      setShouldDisplayAlert(false)
    }, 5000)
  }

  return (
    <div className="App">
      <div className="header">
        <h1>Credit Card Reward Points System</h1>
      </div>
      <div className="main-container">
        <div className="container">
          <TextField 
            label="Transactions as JSON" 
            multiline 
            rows={20} 
            required
            id="text-input"
            value={textInput}
            onChange={handleChange}
          />
          {
            shouldDisplayAlert
            &&
            <Alert severity="error">
              <AlertTitle>Failed to Read JSON</AlertTitle>
              {errorText}
            </Alert>
          }
          <Button
            variant="contained"
            onClick={submitForm}      
          >
            Calculate Points !
          </Button>
        </div>
        <div className="container">
            <PointDisplay data={pointResult} />
        </div>
      </div>
    </div>
  )
}
