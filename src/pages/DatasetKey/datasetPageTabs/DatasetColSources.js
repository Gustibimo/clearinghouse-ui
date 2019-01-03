import React from "react";
import axios from "axios";

import { Table, Alert, List, Switch, Button, Row, Col, Tabs, notification } from "antd";
import config from "../../../config";
import ColSourceMetaDataForm from "../../../components/ColSourceMetaDataForm";
import ColSourceMetaDataList from "../../../components/ColSourceMetaDataList";
import ColSourceSectorList from './ColSourceSectors'
import ErrorMsg from '../../../components/ErrorMsg';
import PageContent from '../../../components/PageContent'

import _ from "lodash";

const TabPane = Tabs.TabPane;

const columns = [
  {
    title: "Title",
    dataIndex: "title",
    key: "title",
    width: 250
  },
  {
    title: "Alias",
    dataIndex: "alias",
    key: "alias"
  },

  {
    title: "Version",
    dataIndex: "version",
    key: "version"
  },

  {
    title: "Coverage",
    dataIndex: "coverage",
    key: "coverage"
  }
];

class ColSourceList extends React.Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.state = {
      data: [],
      dataset: null,
      loading: false,
      editSource: null
    };
  }

  componentWillMount() {
    this.getData();
    this.getDataset();
  }

  getData = () => {
    this.setState({ loading: true });
    const { datasetKey } = this.props;
    axios(`${config.dataApi}colsource?datasetKey=${datasetKey}`)
      .then(res => {
        this.setState({ loading: false, data: res.data, err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: [] });
      });
  };

  getDataset = () => {
    const { datasetKey } = this.props;

    axios(`${config.dataApi}dataset/${datasetKey}`)
      .then(res => {
        this.setState({ dataset: res.data, err: null });
      })
      .catch(err => {
        this.setState({ error: err, dataset: null });
      });
  };

  setEditSource = (checked, source) => {
    if (checked) {
      this.setState({ editSource: source });
    } else {
      this.setState({ editSource: null });
    }
  };


  deleteSource = (source) =>  {
    console.log(source)
    axios.delete(`${config.dataApi}colsource/${source.key}`)
        .then(()=>{
            _.remove(this.state.data, {
                key: source.key
            });
            this.setState({...this.state.data}, ()=>{
                notification.open({
                    message: 'Source deleted',
                    description: `${source.title} (${source.alias}) was deleted`
                });
            });
        })
        .catch(err => {
          this.setState({ error: err });
        }); 
}

  render() {
    const { data, dataset, editSource, loading, error } = this.state;
    const { datasetKey } = this.props;

    return (
      <PageContent>
        {error && <Alert message={<ErrorMsg error={error}></ErrorMsg>} type="error" />}


        {!editSource && (
          <Button
            type="primary"
            size="large"
            style={{ marginBottom: "20px" }}
            onClick={() =>
              this.setEditSource(true, {
                datasetKey: datasetKey,
                title: _.get(dataset, "title") || "",
                description: _.get(dataset, "description") || ""
              })
            }
          >
            New Col Source
          </Button>
        )}
        {editSource && typeof editSource.key === 'undefined'  && (
          <Button
            type="primary"
            size="large"
            style={{ marginBottom: "20px" }}
            onClick={() => this.setEditSource(false)}
          >
            Cancel
          </Button>
        )}

        {editSource &&
          editSource.key === undefined && (
            <ColSourceMetaDataForm
              data={editSource}
              onSaveSuccess={() => {
                this.setEditSource(false);
                this.getData();
              }}
            />
          )}

        {!error && (
          <Table
            expandedRowRender={record => (
              <Tabs defaultActiveKey="1" >
                <TabPane tab="Meta Data" key="1">
                  <Row>
                    <Col span={4}></Col>
                    <Col span={14}>
                      <Switch
                        checked={
                          _.get(this.state, "editSource.key") === record.key
                        }
                        onChange={checked => this.setEditSource(checked, record)}
                        checkedChildren="Cancel"
                        unCheckedChildren="Edit"
                      />
                    </Col>
                    <Col span={6}>
                      <Button type="danger" onClick={()=>this.deleteSource(record)}>Delete</Button>
                    </Col>
                  </Row>

                  {_.get(this.state, "editSource.key") === record.key && (
                    <ColSourceMetaDataForm data={record} />
                  )}
                  {_.get(this.state, "editSource.key") !== record.key && (
                    <Row>
                      
                        <ColSourceMetaDataList colSource={record}/>
                      
                    </Row>
                  )}
                </TabPane>
                <TabPane tab="Taxonomic Coverage" key="2">
                  <ColSourceSectorList sourceKey={record.key} datasetKey={datasetKey}></ColSourceSectorList>
                </TabPane>
              </Tabs>
            )}
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={false}
          />
        )}
      </PageContent>
    );
  }
}

export default ColSourceList;