import React from "react";

import {
  BranchesOutlined,
  CaretRightOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  SyncOutlined,
} from '@ant-design/icons';

import {
  notification,
  Input,
  Tag,
  Button,
  Tooltip,
  Popover,
  Alert,
  Select,
  Row,
  Col,
  Popconfirm,
} from "antd";
import _ from "lodash";
import axios from "axios";
import config from "../../../config";
import history from "../../../history";
import { stringToColour } from "../../../components/util";
import { ColTreeContext } from "./ColTreeContext";
import ErrorMsg from "../../../components/ErrorMsg";
import SectorNote from "./SectorNote"
import withContext from "../../../components/hoc/withContext"
import {debounce} from 'lodash';
import Auth from '../../../components/Auth'
const {Option} = Select;

class Sector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      popOverVisible: false,
      error: null
    };
  }

  hidePopover = () => {
    this.setState({
      popOverVisible: false
    });
  };
  handleVisibleChange = popOverVisible => {
    this.setState({ popOverVisible, error: null });
  };

  syncSector = (sector, syncState, syncingSector) => {
    const {idle} = syncState;
    const {catalogueKey} = this.props;
    axios
      .post(`${config.dataApi}dataset/${catalogueKey}/sector/sync`, {
        sectorKey: sector.id,
        key: sector.id,
        target: sector.target,
        subject: sector.subject
      })
      .then(() => {
        // If there is no sync jobs running, try to give the backend a chance to insert the root node again
        debounce(this.props.reloadSelfAndSiblings, 1500)();
       // this.props.reloadSelfAndSiblings();
        this.props.getSyncState();
        notification.open({
          message: idle ? "Sync started" : "Sync queued",
          description: !syncingSector && idle ? `Copying taxa from ${sector.id}` : `Awaiting sector ${_.get(syncingSector, 'id')} (${_.get(syncingSector, 'subject.name')})`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };

  deleteSector = sector => {
    const {catalogueKey} = this.props
    axios
      .delete(
        `${config.dataApi}dataset/${catalogueKey}/sector/${
          sector.id
        }`
      ) // /assembly/3/sync/
      .then(() => {
        debounce(this.props.onDeleteSector, 500)();
        notification.open({
          message: "Deletion triggered",
          description: `Delete job for ${sector.id} placed on the sync queue`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  };
  updateSectorCode = code => {
    const { taxon : {sector}, catalogueKey} = this.props;
    axios
      .put(
        `${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`, {...sector, code: code}
      ) 
      .then(() => {
        notification.open({
          message: "Nom. code for sector updated",
          description: `New code is ${code}`
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  }

  updateSectorRank = rank => {
    const { taxon : {sector}, catalogueKey} = this.props;
    axios
      .put(
        `${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`, {...sector, rank: rank}
      ) 
      .then(() => {
        notification.open({
          message: "Ranks for sector configured"
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  }

  updateSectorNote = note => {
    const { taxon : {sector}, catalogueKey} = this.props;
    axios
      .put(
        `${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`, {...sector, note: note}
      ) 
      .then(() => {
        notification.open({
          message: "Sector note updated:",
          description: note
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  }

  updateSectorEntities = entities => {
    const { taxon : {sector}, catalogueKey} = this.props;
    axios
      .put(
        `${config.dataApi}dataset/${catalogueKey}/sector/${sector.id}`, {...sector, entities: entities}
      ) 
      .then(() => {
        notification.open({
          message: "Sector entities updated"
        });
      })
      .catch(err => {
        this.setState({ error: err });
      });
  }

  applyDecision = () => {
    const { taxon, decisionCallback, catalogueKey } = this.props;
    const { sector } = taxon;

    const { datasetKey } = taxon;
    this.setState({ postingDecisions: true });

    

    return axios(
      `${config.dataApi}dataset/${datasetKey}/taxon/${_.get(taxon, "id")}`
    ).then(tx => {
     return Promise.all([tx, axios(
        `${config.dataApi}dataset/${datasetKey}/taxon/${_.get(tx, "data.parentId")}`
      )])
    })
    
    .then(taxa => {
      const tx = taxa[0].data;
      const parent = taxa[1].data;
      return axios.post(`${config.dataApi}dataset/${catalogueKey}/decision`, {
        subjectDatasetKey: datasetKey,
        subject: {
          id: _.get(tx, "id"),

          name: _.get(tx, "name.scientificName"), //.replace(/(<([^>]+)>)/ig , "")
          authorship: _.get(tx, "name.authorship"),
            rank: _.get(tx, "name.rank"),
            status: _.get(tx, "status"),
            parent: _.get(parent, "name.scientificName"),
            code: _.get(tx, "name.code")
        },
        mode: "block"
      })
    })
      .then(decisionId => axios(`${config.dataApi}dataset/${catalogueKey}/decision/${decisionId.data}`))
      .then(res => {
        taxon.decision = res;

        notification.open({
          message: `Decision applied`,
          description: `${_.get(taxon, "name").replace(/(<([^>]+)>)/ig , "")} was blocked from the assembly`
        });
        if (typeof decisionCallback === "function") {
          decisionCallback();
        }
      })
      .catch(err => {
        notification.error({
          message: "Error",
          description: err.message
        });
      });
  };

  render = () => {
    const { taxon, nomCode, user, catalogueKey, entitytype } = this.props;

    const { error } = this.state;
    const { sector } = taxon;
    const { dataset: sectorSourceDataset } = sector;
    const isPlaceHolder = taxon.id.indexOf("--incertae-sedis--") > -1;
    const isRootSector =
      
      (!_.get(taxon, "parentId") && !isPlaceHolder) ||
      (_.get(sector, "target.id") &&
        sector.target &&
        taxon.parentId === sector.target.id);
    const isRootSectorInSourceTree = taxon.id === sector.subject.id;
    const isSourceTree =
    catalogueKey !== _.get(taxon, "datasetKey");

    if (!sectorSourceDataset) {
      return "";
    }
    return !isSourceTree ? (
      <ColTreeContext.Consumer>
        {({ syncState, syncingSector }) => (
          <Popover
            content={
              <div>
                {isRootSector && (
                  <React.Fragment>
{/*                     <Popconfirm
            placement="rightTop"
            title="Delete sector will delete the sector mapping and all species and below, but keep the higher classification above species rank. Go ahead?"
            onConfirm={() => {
              this.deleteSector(sector);
            }}
            okText="Yes"
            cancelText="No"
          > */}
          <Tooltip title="Delete sector will delete the sector mapping and all species, but keep the higher classification above species">
                    <Button
                      style={{ width: "100%" }}
                      type="danger"
                      onClick={() => {
                        this.deleteSector(sector);
                      }}
                    >
                      Delete sector
                    </Button>
                    </Tooltip>
{/*           </Popconfirm>
 */}
                    <br />

                    {_.get(syncState, "running.sectorKey") !== sector.id && (
                      <React.Fragment>
                        <Button
                          style={{ marginTop: "8px", width: "100%" }}
                          type="primary"
                          onClick={() => {
                            this.syncSector(sector, syncState, syncingSector);
                          }}
                        >
                          Sync sector
                        </Button>{" "}
                        <br />
                      </React.Fragment>
                    )}
                  </React.Fragment>
                )}
                <Button
                  style={{ marginTop: "8px", width: "100%" }}
                  type="primary"
                  onClick={() => {
                    history.push(`/catalogue/${catalogueKey}/sector?id=${sector.id}`);
                  }}
                >
                  Show sector
                </Button>
                <br />
                <Button
                  style={{ marginTop: "8px", width: "100%" }}
                  type="primary"
                  onClick={() =>
                    this.props.showSourceTaxon(sector, sectorSourceDataset)
                  }
                >
                  Show sector in source
                </Button>
                <br />
                <Button
                  style={{ marginTop: "8px", width: "100%" }}
                  type="primary"
                  onClick={() => {
                    history.push(`dataset/${sectorSourceDataset.key}/meta`);
                  }}
                >
                  Source Dataset Metadata
                </Button>


                {isRootSector && (  
                <React.Fragment>
                <Row style={{ marginTop: "8px" }}>
                  <Col span={9}>
                    Nom. code
                  </Col>
                  <Col span={15} style={{paddingLeft: '8px'}}>
                <Select style={{ width: '100%' }} defaultValue={sector.code} onChange={value => this.updateSectorCode(value)} showSearch>

              {nomCode.map((f) => {
                return <Option key={f.name} value={f.name}>{f.name}</Option>
              })}
            </Select>
            </Col>
                </Row> 
                <Row style={{ marginTop: "8px" }}>
                  <Col span={9}>
                    Ranks
                  </Col>
                  <Col span={15} style={{paddingLeft: '8px'}}>
                <Select style={{ width: '100%' }} defaultValue={sector.rank} onChange={value => this.updateSectorRank(value)} showSearch>

                <Option  value={null}>All</Option>
                <Option  value="Linnean">Linnean</Option>
                <Option  value="CoL">CoL</Option>
            </Select>
            </Col>
                </Row> 
                <Row style={{ marginTop: "8px" }}>
                  <Col span={9}>
                  Entities
                  </Col>
                  <Col span={15} style={{paddingLeft: '8px'}}>
                <Select mode="multiple" style={{ width: '100%' }} defaultValue={sector.entities || []} onChange={value => this.updateSectorEntities(value)} showSearch>

              {entitytype.map((f) => {
                return <Option key={f.name} value={f.name}>{f.name}</Option>
              })}
            </Select>
            </Col>
                </Row> 
                <Row style={{ marginTop: "8px" }}>
                <SectorNote note={sector.note} onSave={this.updateSectorNote}></SectorNote>
                </Row>
                </React.Fragment>
                )}
                {/* !isRootSector && (
            <React.Fragment>
              <br />
              <Button
              style={{ marginTop: "8px", width: "100%" }}
              type="danger"
              onClick={() => {
                alert("block")
              }}
            >
              Block taxon
            </Button>
            </React.Fragment>
            ) */}
                {error && (
                  <Alert
                  closable
                   onClose={() => this.setState({ error: null })}
                    message={
                      <ErrorMsg error={error} style={{ marginTop: "8px" }} />
                    }
                    type="error"
                  />
                )}
              </div>
            }
            title={<React.Fragment>Sector mode: {sector.mode === 'attach' ? <CaretRightOutlined /> : <BranchesOutlined rotate={90} style={{ fontSize: '16px', marginRight: '4px'}} />} {sector.mode}</React.Fragment>}
            visible={this.state.popOverVisible}
            onVisibleChange={this.handleVisibleChange}
            trigger="click"
            placement="rightTop"
          >
            <Tooltip title={sectorSourceDataset.title} placement="top">
              <Tag color={stringToColour(sectorSourceDataset.title)}>
                {isRootSector && sector.mode === 'attach' && <CaretRightOutlined />}
                {isRootSector && sector.mode === 'union' && <BranchesOutlined rotate={90} style={{ fontSize: '16px', marginRight: '4px'}} /> }
                {sectorSourceDataset.alias || sectorSourceDataset.key}
                {_.get(syncState, "running.sectorKey") === sector.id && (
                  <SyncOutlined style={{ marginLeft: "5px" }} spin />
                )}
                {_.find(_.get(syncState, "queued"), e => e.sectorKey === sector.id ) && <HistoryOutlined style={{ marginLeft: "5px" }} />}
              </Tag>
            </Tooltip>
          </Popover>
        )}
      </ColTreeContext.Consumer>
    ) : (
      <ColTreeContext.Consumer>
        {({ syncState, syncingSector, missingTargetKeys }) => (
          <Popover
            content={
              <div>
              {missingTargetKeys[_.get(sector, 'target.id')] === true && <Alert type="warning" style={{ marginBottom: '8px'}} message={<p>{`${_.get(sector, 'target.name')} with id: ${_.get(sector, 'target.id')} is missing from the assembly.`}<br/>{`You can delete this sector and reattach ${_.get(sector, 'subject.name')} under ${_.get(sector, 'target.name')} if present with another id`}</p>}></Alert>}
              {Auth.isAuthorised(user, ["editor", "admin"]) && isRootSectorInSourceTree && 
                    <Button
                      style={{ width: "100%" }}
                      type="danger"
                      onClick={() => {
                        this.deleteSector(sector);
                      }}
                    >
                      Delete sector
                    </Button>}
              {missingTargetKeys[_.get(sector, 'target.id')] !== true &&  <Button
                  style={{ marginTop: "8px", width: "100%" }}
                  type="primary"
                  onClick={() =>
                    this.props.showSourceTaxon(sector)
                  }
                >
                  Show sector in assembly
                </Button>}
                {Auth.isAuthorised(user, ["editor", "admin"]) && isRootSectorInSourceTree && missingTargetKeys[_.get(sector, 'target.id')] !== true &&
                  _.get(syncState, "running.sectorKey") !== sector.id && (
                    <React.Fragment>
                      <Button
                        style={{ marginTop: "8px", width: "100%" }}
                        type="primary"
                        onClick={() => {
                          this.syncSector(sector, syncState, syncingSector);
                        }}
                      >
                        Sync sector
                      </Button>{" "}
                      <br />
                    </React.Fragment>
                  )}
                {Auth.isAuthorised(user, ["editor", "admin"]) && !isRootSectorInSourceTree && (
                  <Button
                    style={{ marginTop: "8px", width: "100%" }}
                    type="danger"
                    onClick={this.applyDecision}
                  >
                    Block taxon
                  </Button>
                )}
                {error && (
                  <Alert
                  style={{marginTop: '8px'}}
                  closable
                   onClose={() => this.setState({ error: null })}
                    message={
                      <ErrorMsg error={error} style={{ marginTop: "8px" }} />
                    }
                    type="error"
                  />
                )}
              </div>
            }
            title={<React.Fragment>Sector mode: {sector.mode === 'attach' ? <CaretRightOutlined /> : <BranchesOutlined rotate={90} style={{ fontSize: '16px', marginRight: '4px'}} />} {sector.mode}</React.Fragment>}
            visible={this.state.popOverVisible}
            onVisibleChange={this.handleVisibleChange}
            trigger="click"
            placement="rightTop"
          >
            <Tag color={stringToColour(sectorSourceDataset.title)}>
              {missingTargetKeys[_.get(sector, 'target.id')] === true && <ExclamationCircleOutlined />}
              {isRootSectorInSourceTree && sector.mode === 'attach' && <CaretRightOutlined />}
                {isRootSectorInSourceTree && sector.mode === 'union' && <BranchesOutlined style={{ fontSize: '16px', marginRight: '4px' }} rotate={90} />}
              {sectorSourceDataset.alias || sectorSourceDataset.key}
              {_.get(syncState, "running.sectorKey") === sector.id && (
                <SyncOutlined style={{ marginLeft: "5px" }} spin />
              )}
              {_.find(_.get(syncState, "queued"), e => e.sectorKey === sector.id ) && <HistoryOutlined style={{ marginLeft: "5px" }} />}
            </Tag>
          </Popover>
        )}
      </ColTreeContext.Consumer>
    );
  };
}

const mapContextToProps = ({ nomCode, user, catalogueKey, entitytype }) => ({ nomCode, user, catalogueKey, entitytype });
export default withContext(mapContextToProps)(Sector)



