import React from "react";
import config from "../../config";
import { Redirect } from 'react-router-dom'
import axios from "axios";
import queryString from "query-string";
import { Alert } from "antd";
import DatasetMeta from "./datasetPageTabs/DatasetMeta";
import DatasetImportMetrics from "../DatasetImportMetrics";
import DatasetClassification from "./datasetPageTabs/DatasetClassification";
import DatasetSectors from "./datasetPageTabs/DatasetSectors"
import DatasetReferences from "./datasetPageTabs/DatasetReferences"
import Layout from "../../components/LayoutNew";
import DatasetIssues from "./datasetPageTabs/DatasetIssues"
import DatasetTasks from "./datasetPageTabs/DatasetTasks"
import DatasetSettings from "./datasetPageTabs/DatasetSettings"
import NameSearch from "../NameSearch"
import WorkBench from "../WorkBench"

import withContext from "../../components/hoc/withContext"
import Exception404 from "../../components/exception/404";

import _ from 'lodash'
import Helmet from 'react-helmet'
import Duplicates from "../Duplicates";
import Taxon from "../Taxon"
import Name from "../Name"
import VerbatimRecord from "../VerbatimRecord"
import moment from "moment"
class DatasetPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: null,
      loading: true,
      importState: null,
      hasData: false,
      lastSuccesFullImport: null
    };
  }

  componentDidMount() {
    const {
      match: {
        params: { key: datasetKey }
      }
    } = this.props;
    this.getData(datasetKey);
  }

  componentDidUpdate = (prevProps) => {
    if(_.get(this.props, 'match.params.key') !== _.get(prevProps, 'match.params.key')){
      this.getData(_.get(this.props, 'match.params.key'));
    }
  }


  getData = datasetKey => {
    
    const {dataset} = this.props;

    Promise.all([axios(`${config.dataApi}dataset/${datasetKey}/import`), axios(`${config.dataApi}dataset/${datasetKey}/import?state=finished`)])
      
      .then(res => {
        const importState = _.get(res[0], 'data[0].state') || null;
        const hasData = res[1].data.length > 0;
        this.setState({ importState, hasData, lastSuccesFullImport: hasData ? _.get(res, '[1].data[0]') : null });
      })
      .catch(err => {
        this.setState({ importState: null });
      });
  };



  render() {
  //  const { datasetKey, section, dataset } = this.props;
  const { importState, hasData, lastSuccesFullImport } = this.state;

    const {
      match: {
        params: { key: datasetKey, section, taxonOrNameKey , catalogueKey}
      },
      location,
      dataset,
      importStateMap
    } = this.props;

    if (dataset && !section && !_.get(dataset, 'deleted') ) {
      return <Redirect to={{
        pathname: `/dataset/${datasetKey}/names`
      }} />
    } 
    if (dataset && !section && _.get(dataset, 'deleted') ) {
      return <Redirect to={{
        pathname: `/dataset/${datasetKey}/meta`
      }} />
    } 
    
  
   
    const sect = (!section) ? "meta" : section.split('?')[0];
    const openKeys = ['dataset', 'datasetKey']
    const selectedKeys = [section]
    return (
      
      <Layout
        selectedDataset={dataset}
        selectedCatalogueKey={catalogueKey}
        openKeys={openKeys}
        selectedKeys={selectedKeys}
        taxonOrNameKey={taxonOrNameKey}
      >
     {_.get(dataset, 'title') && <Helmet 
      title={`${_.get(dataset, 'title')} in CoL+`}
     />}
      { dataset && _.get(dataset, 'deleted' ) && <Alert style={{marginTop: '16px'}} message={`This dataset was deleted ${moment(dataset.deleted).format('LLL')}`} type="error" />}
      { importState && _.get(importStateMap[importState], 'running' ) === "true" && <Alert style={{marginTop: '16px'}} message="The dataset is currently being imported. Data may be inconsistent." type="warning" />}
      { importState && importState === 'failed' &&  <Alert style={{marginTop: '16px'}} message="Last import of this dataset failed." type="error" />}
        {section === "issues" && <DatasetIssues datasetKey={datasetKey} />}
        {section === "imports" && <DatasetImportMetrics datasetKey={datasetKey} origin={_.get(dataset, 'origin')} match={this.props.match} updateImportState={() => this.getData(datasetKey)} />}
        {!section || section === "meta" && <DatasetMeta id={datasetKey} />}
        {section === "classification" && (
          <DatasetClassification dataset={dataset} datasetKey={datasetKey}  location={location} />
        )}
        {section === "projects" && (
          <DatasetSectors dataset={dataset} catalogueKey={catalogueKey} location={location} />
        )}
        
        {sect === "names" && (
          <NameSearch datasetKey={datasetKey} location={this.props.location} />
        )}
        {sect === "workbench" && (
          <WorkBench datasetKey={datasetKey} location={this.props.location} catalogueKey={catalogueKey} /> 
        )} {/* catalogueKeys are used to scope decisions and tasks */}
        {sect === "duplicates" && (
          <Duplicates datasetKey={datasetKey} location={this.props.location} catalogueKey={catalogueKey} />
        )}
        {sect === "references" && (
          <DatasetReferences datasetKey={datasetKey} location={this.props.location} />
        )}
        {sect === "tasks" && (
          <DatasetTasks datasetKey={datasetKey} location={this.props.location} catalogueKey={catalogueKey}/>
        )}
        {sect === "taxon" && (
          <Taxon datasetKey={datasetKey} location={this.props.location} match={this.props.match}  />
        )}
        {sect === "name" && (
          <Name datasetKey={datasetKey} location={this.props.location} match={this.props.match}  />
        )}
        {sect === "verbatim" && (
          <VerbatimRecord datasetKey={datasetKey} lastSuccesFullImport={lastSuccesFullImport} location={this.props.location} match={this.props.match}  />
        )}
        
        {sect === "settings" && <DatasetSettings datasetKey={datasetKey} />}
      </Layout>
    );
  }
}

const mapContextToProps = ({dataset, importStateMap}) => ({dataset, importStateMap})
export default withContext(mapContextToProps)(DatasetPage);
