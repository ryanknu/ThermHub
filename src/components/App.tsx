import React from 'react';
import CONFIG from '../config';
import {AppState, init} from '../interfaces/App';
import {generateHeader} from '../interfaces/Header';
import {getDate} from '../helpers/trackTime'
import Header from './Header';
import ThermPanel from './ThermPanel';
import WeatherForecast from './WeatherForecast';
import ThermModal from './ThermModal';
import { NowResponse } from '../interfaces/NowResponse';
import Therma from '../interfaces/Therm';

class App extends React.Component<{}, AppState> {
  private timeThread = 0;

  constructor(props:{}) {
    super (props);
    this.state = init();

    this.expandThermPanel = this.expandThermPanel.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }

  componentDidMount(): void {
    this.startTimeThread();
  }

  componentWillUnmount(): void {
    if (this.timeThread) {
      clearInterval(this.timeThread);
      this.timeThread = 0;
    }
  }

  private startTimeThread(): void {
    this.timeThread = window.setInterval(() => {
      const date = getDate();
      if (date !== undefined) {
        this.setState({date});
        this.updateData(date);
      }
    }, 2000);
  }

  private updateData(now: Date): void {
    this.fetchNow()
      .then(data => {
        const {forecast, thermostats} = data;
        const currentWeatherData = thermostats.find(therm => therm.name === 'weather.gov');
        
        this.setState({
          header: generateHeader(CONFIG.city, CONFIG.state, currentWeatherData?.temperature),
          thermostats,
          forecast,
        });
      });
    this.fetchPast(new Date(now.getTime() - 43200000), now)
      .then(past => {
        this.setState({past});
      });
  }

  private fetchNow = (): Promise<NowResponse> => 
    fetch(`${CONFIG.host}/now`).then(res => res.json());
  
  private fetchPast = (after: Date, before: Date): Promise<Therma[]> =>
    fetch(`${CONFIG.host}/past?start_date=${after.toISOString()}&end_date=${before.toISOString()}`).then(res => res.json());
  
  expandThermPanel(e:Event): void {
    const target = e.currentTarget as HTMLInputElement;
    const index = Number(target.getAttribute('id'));

    this.setState({ showThermModal: true, thermModalIdx: index })
  }

  closeModal(): void {
    this.setState({ showThermModal: false, thermModalIdx: -1 });
  }

  render() {
    const {header, date} = this.state;
    return (
      <>
        <div className="flex p-10 pt-5 bg-indigo-200 bg-opacity-75 h-screen justify-around">
            <div className="inline-flex w-2/12 flex-col justify-center">
              <div className="text-left text-5xl font-bold text-blue-600 tracking-tight">{`Therm\u00b0`}</div>
              <div className="py-5 bg-blue-100 bg-opacity-75 shadow-lg rounded-lg border border-solid border-indigo-200"> 
                <div className="ml-2 mb-2 font-light text-blue-500">Select a Location:</div>
                <input className="h-10 rounded-lg border border-solid border-gray-300 w-3/4 ml-2 pl-2 font-thin shadow-lg" type="text" placeholder="Enter a city"/>
                <div className="ml-2 mt-5 mb-2 font-light text-blue-500">Degrees format:</div>
                <div className="flex flex-row ml-2">
                  <button className="bg-teal-400 py-1 px-4 text-white rounded-full mr-2 shadow-lg font-thin">{`Fahrenheit (F${`\u00b0`})`}</button>
                  <button className="border border-solid border-teal-300 bg-white text-teal-400 py-1 px-4 rounded-full shadow-lg font-thin">{`Celsius (C${`\u00b0`})`}</button>
                </div>
                <div className="ml-2 mt-5 mb-2 font-light text-blue-500">Time format:</div>
                <div className="flex flex-row ml-2">
                  <button className="border border-solid border-teal-300 text-teal-400 bg-white py-1 px-8 rounded-full shadow-lg font-thin mr-2">12H</button>
                  <button className="bg-teal-400 py-1 px-8 text-white rounded-full shadow-lg font-thin">24H</button>
                </div>
              </div>
            </div>
            <div className="inline-flex flex-col justify-center w-3/4">
                <div className="inline-flex flex-col">
                      <Header headerData={header} date={date} use24Hour={true} />
                      <ThermPanel thermostatData={this.state.thermostats} expandThermPanel={this.expandThermPanel} pastData={this.state.past} />
                      <WeatherForecast forecastData={this.state.forecast} />
                </div>
            </div>
        </div>
        {this.state.showThermModal ? <ThermModal therma={this.state.thermostats[this.state.thermModalIdx]} updateModalDisplay={this.closeModal} /> : <div />}
      </>
      );
  }
}

export default App;
