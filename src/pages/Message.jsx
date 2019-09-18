import React from 'react';

class Message extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <h6>{this.props.message}</h6>
    );
  }
}

export default Message;
