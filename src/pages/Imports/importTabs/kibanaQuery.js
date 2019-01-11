
const kibanaQuery = (datasetKey) => `https://logs.gbif.org/app/kibana#/discover?_g=(refreshInterval:(display:On,pause:!f,value:0),time:(from:now-7d,mode:quick,to:now))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:AWBa0XR-f8lu3pmE7ete,key:environment,negate:!f,type:phrase,value:col),query:(match:(environment:(query:col,type:phrase)))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:AWGthDPVf8lu3pmEwvFE,key:level,negate:!t,type:phrase,value:DEBUG),query:(match:(level:(query:DEBUG,type:phrase)))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:AWGthDPVf8lu3pmEwvFE,key:level,negate:!t,type:phrase,value:INFO),query:(match:(level:(query:INFO,type:phrase)))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:AWGthDPVf8lu3pmEwvFE,key:dataset,negate:!f,type:phrase,value:'${datasetKey}'),query:(match:(dataset:(query:'${datasetKey}',type:phrase))))),index:AWGthDPVf8lu3pmEwvFE,interval:auto,query:(match_all:()),sort:!('@timestamp',desc))`
export default kibanaQuery