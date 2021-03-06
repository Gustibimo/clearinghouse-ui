import axios from "axios";
import config from "../config";

export const getTerms = () => {
  return axios(`/terms.json`).then(res => res.data)
};

export const getTermsOrder = () => {
  return axios(`${config.dataApi}vocab/terms`).then(res =>
    res.data
  );
};

