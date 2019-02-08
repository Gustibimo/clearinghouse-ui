import React from "react";
import PropTypes from "prop-types";
import config from "../../../config";
import _ from "lodash";
import axios from "axios";
import { Switch, List, Row, Col, Select } from "antd";
import MetaDataForm from "../../../components/MetaDataForm";
import LogoUpload from "../../../components/LogoUpload";
import ArchiveUpload from "../../../components/ArchiveUpload";
import PageContent from '../../../components/PageContent'
import { FormattedMessage } from 'react-intl'
import PresentationItem from '../../../components/PresentationItem'
import DeleteDatasetButton from './DeleteDatasetButton'
import withContext from '../../../components/hoc/withContext'
import Auth from '../../../components/Auth'
const Option = Select.Option;

class DatasetMeta extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: null, editMode: false };
  }

  componentWillMount() {
    this.getData();
  }

  getData = () => {
    const { id } = this.props;

    this.setState({ loading: true });
    axios(`${config.dataApi}dataset/${id}`)
    .then(res => {
      const {createdBy, modifiedBy} = res.data;
      return Promise.all([
        res.data,
        axios(`${config.dataApi}user/${createdBy}`),
        axios(`${config.dataApi}user/${modifiedBy}`)
      ])
    })
      .then(res => {
        res[0].createdByUser = _.get(res[1], 'data.username'),
        res[0].modifiedByUser = _.get(res[2], 'data.username'),
        this.setState({ loading: false, data: res[0], err: null });
      })
      .catch(err => {
        this.setState({ loading: false, error: err, data: {} });
      });
  };

  setEditMode = (checked) => {
    this.setState({ editMode: checked });
  }



  render() {

    const { data, editMode } = this.state;
    const {  user } = this.props;
    const listData = _.map(data, function(value, key) {
      return { key, value };
    });
    return (
      <PageContent>
      { Auth.isAuthorised(user, ['editor', 'admin']) && 
      <React.Fragment>
      <Row>
          
          <Col span={4}>
            <LogoUpload datasetKey={this.props.id} />
          </Col>
          <Col span={2} offset={18}>
          { data && <DeleteDatasetButton record={data}></DeleteDatasetButton>}
          </Col>
        </Row> 
        <Row>
        
        <Col span={2} offset={22}>
            {data &&  (
              <Switch
                checked={editMode}
                onChange={this.setEditMode}
                checkedChildren="Cancel"
                unCheckedChildren="Edit"
              />
            )}

          </Col>
       
        </Row> </React.Fragment>}

        {editMode && (
          <MetaDataForm
            data={data}
            onSaveSuccess={() => {
              this.setEditMode(false);
            }}
          />
        )}
        {!editMode && (
          <dl>
            {listData.filter((o)=> !['createdBy', 'modifiedBy'].includes(o.key)).map((obj)=> <PresentationItem key={obj.key} label={<FormattedMessage id={obj.key} defaultMessage={_.startCase(obj.key)} />} >
            {obj.value}
          </PresentationItem>)}
          
          </dl>
        )}
      </PageContent>
    );
  }
}

const mapContextToProps = ({ user, datasetOrigin : datasetoriginEnum }) => ({ user, datasetoriginEnum });

export default withContext(mapContextToProps)(DatasetMeta);
