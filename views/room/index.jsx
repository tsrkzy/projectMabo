const React = require('react');

class Content extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <html>
        <head>
          <title>{this.props.title}</title>
        </head>
        <body>
          <p>roomId: {this.props.roomId}</p>
          <p>hash: {this.props.hash}</p>
          <div id="container"></div>
          <script type="text/javascript" src="/client.bundle.js"></script>
        </body>
      </html>
    );
  }
}

module.exports = Content;