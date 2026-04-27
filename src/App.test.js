import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

jest.mock('./components/Firebase.js', () =>
  jest.fn().mockImplementation(() => ({
    ltiContext: {},
  }))
);

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App/>, div);
  ReactDOM.unmountComponentAtNode(div);
});
