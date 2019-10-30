import React from "react";
import axios from "axios";
import config from "../config";

import { Upload, Icon, message, Button, Alert } from "antd";
import ErrorMsg from "../components/ErrorMsg";

class ArchiveUpload extends React.Component {
  constructor(props) {
    super(props);
    this.customRequest = this.customRequest.bind(this);
    this.onChange = this.onChange.bind(this);
    this.state = {
      submissionError: null,
      fileList: []
    };
  }

  customRequest = options => {
    const config = {
      headers: {
        "content-type": options.file.type
      }
    };
    return axios
      .post(options.action, options.file, config)
      .then(res => {
        options.onSuccess(res.data, options.file);
        this.setState({ submissionError: null });
      })
      .catch(err => {
        options.onError(err)
        this.setState({ submissionError: err });
        console.log(err);
      });
  };

  onChange(info) {
    if (info.file.status !== "uploading") {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === "done") {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} file upload failed.`);
    }
    this.setState({fileList: [info.file]})
  }
  render() {
    const { datasetKey } = this.props;
    const { submissionError, fileList } = this.state;
    return (
      <div className="clearfix">
        {submissionError && (
          <Alert
            style={{marginBottom: '8px'}}
            closable
            onClose={() => this.setState({ submissionError: null })}
            message={<ErrorMsg error={submissionError} />}
            type="error"
          />
        )}
        <Upload
          action={`${config.dataApi}importer/${datasetKey}`}
          customRequest={this.customRequest}
          onChange={this.onChange}
          fileList={fileList}
        >
          <Button>
            <Icon type="upload" /> Upload Data Archive
          </Button>
        </Upload>
      </div>
    );
  }
}

export default ArchiveUpload;
