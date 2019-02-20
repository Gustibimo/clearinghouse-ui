import React from "react";
import {
  Row,
  Col,
  notification,
  Tag,
  Popconfirm,
  Icon,
  Button,
  Popover
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../config";
import {ColTreeContext} from "./ColTreeContext"
import Sector from "./Sector"


class ColTreeNode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: {},
      popOverVisible: false
    };
  }
  setMode = mode => {
    this.setState({ mode });
  };



  deleteTaxon = taxon => {
   axios
      .delete(`${config.dataApi}dataset/${taxon.datasetKey}/tree/${taxon.id}`)
      .then(() => {
        this.props.reloadSelfAndSiblings();
        notification.open({
          message: "Taxon deleted",
          description: `${
            taxon.name
          } was deleted from the CoL draft`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  render = () => {
    const {
      taxon,
      taxon: { sectors },
      hasPopOver,
      isUpdating
    } = this.props;
    const sector = _.get(sectors, '[0]') || null
    const { sectorSourceDataset } = this.state;
    return (
      <div>
        <ColTreeContext.Consumer>
        { ({mode} )=> (mode === "modify" &&
          hasPopOver && (
            <Popover
              content={
                <Row>
                  <Col span={12}>
                    <Button type="danger" onClick={() => this.deleteTaxon(taxon)}>Delete taxon</Button>
                  </Col>
                 { /* <Col span={12}>
                    {" "}
                    <Button style={{ marginLeft: "12px" }} type="primary">
                      Add child
                    </Button>
              </Col> */}
                </Row>
              }
              title="Options"
              visible={this.state.popOverVisible}
              onVisibleChange={this.handleVisibleChange}
              trigger="click"
              placement="rightTop"
            >
              <Popconfirm
                visible={this.props.confirmVisible}
                title={this.props.confirmTitle}
                onConfirm={this.props.onConfirm}
                onCancel={this.props.onCancel}
              >
                <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                  {taxon.rank}:{" "}
                </span>
                <span dangerouslySetInnerHTML={{__html: taxon.name}}></span>
                {mode === "modify" &&
                  !_.isUndefined(taxon.speciesCount) && (
                    <span>
                      {" "}
                      • {taxon.speciesCount}{" "}
                      {!_.isUndefined(taxon.speciesEstimate) && (
                        <span> of {taxon.speciesEstimate} est. </span>
                      )}
                      living species
                    </span>
                  )}
                {isUpdating && (
                  <span>
                    {" "}
                    <Icon type="sync" spin />
                  </span>
                )}
                {taxon.status !== "accepted" && (
                  <Tag color="red" style={{ marginLeft: "6px" }}>
                    {taxon.status}
                  </Tag>
                )}
              </Popconfirm>
            </Popover>
          ) )}
          </ColTreeContext.Consumer>
          <ColTreeContext.Consumer>

          { ({mode, selectedSourceDatasetKey, getSyncState} ) => ((mode !== "modify" || !hasPopOver) && (
          <Popconfirm
            visible={this.props.confirmVisible}
            title={this.props.confirmTitle}
            onConfirm={this.props.onConfirm}
            onCancel={this.props.onCancel}
          >
            <div>
              <span style={{ color: "rgba(0, 0, 0, 0.45)" }}>
                {taxon.rank}:{" "}
              </span>
              <span dangerouslySetInnerHTML={{__html: taxon.name}}></span>
              {mode === "modify" &&
                !_.isUndefined(taxon.speciesCount) && (
                  <span>
                    {" "}
                    • {taxon.speciesCount}{" "}
                    {!_.isUndefined(taxon.speciesEstimate) && (
                      <span> of {taxon.speciesEstimate} est. </span>
                    )}
                    living species
                  </span>
                )}
              {isUpdating && (
                <span>
                  {" "}
                  <Icon type="sync" spin />
                </span>
              )}
              {taxon.status !== "accepted" && (
                <Tag color="red" style={{ marginLeft: "6px" }}>
                  {taxon.status}
                </Tag>
              )}

              {
                sector &&
                this.props.showSourceTaxon && (
                  <span>
                    <span> • </span>
                  <Sector {...this.props} selectedSourceDatasetKey={selectedSourceDatasetKey} getSyncState={getSyncState}/>
                  </span>
                )}
            </div>
          </Popconfirm>
        ))}
      </ColTreeContext.Consumer>
      </div>
    );
  };
}


export default ColTreeNode;
