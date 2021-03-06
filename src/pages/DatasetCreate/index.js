import React from "react";
import Layout from "../../components/LayoutNew";
import MetaDataForm from "../../components/MetaDataForm";
import history from "../../history";
import PageContent from '../../components/PageContent'
import withContext from "../../components/hoc/withContext";


class DatasetCreate extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {catalogueKey} = this.props;
    return (
      <Layout 
        openKeys={["dataset"]}
        selectedKeys={["datasetCreate"]} title="New Dataset">
        
        <PageContent>
          
        <MetaDataForm
          onSaveSuccess={(res) => {
            history.push(`/dataset/${res.data}/meta`);
          }}
        />
        </PageContent>
      </Layout>
    );
  }
}

const mapContextToProps = ({ catalogueKey }) => ({ catalogueKey });

export default withContext(mapContextToProps)(DatasetCreate);
