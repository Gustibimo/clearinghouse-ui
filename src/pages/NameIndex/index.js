import React from "react";

import Layout from "../../components/LayoutNew";
import config from "../../config";
import _ from "lodash";
import Helmet from "react-helmet";


import ErrorMsg from "../../components/ErrorMsg";
import PageContent from "../../components/PageContent";
import NameSearch from "../NameSearch"

class NameIndex extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      
    };
  }
  

  render() {
    const {
      
    } = this.state;

    return (
      <Layout openKeys={[]} selectedKeys={['nameIndex']} title="Catalogue of Life + Name Index">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Catalogue of Life + Name Index</title>
          <link rel="canonical" href="http://www.col.plus" />
        </Helmet>
        <PageContent>
            <NameSearch location={this.props.location} />
        </PageContent>
      </Layout>
    );
  }
}

export default NameIndex;