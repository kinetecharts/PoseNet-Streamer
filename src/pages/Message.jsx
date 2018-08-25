import React from 'react';

class Message extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <h6>Status: {this.props.message}</h6>
    );
  }
}

export default Message;
