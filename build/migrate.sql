--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: locator_map; Type: TABLE; Schema: public; Owner: -; Tablespace: 
--

CREATE TABLE locator_map (
    id bigint NOT NULL,
    data json
);


--
-- Name: locator_map_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE locator_map_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: locator_map_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE locator_map_id_seq OWNED BY locator_map.id;


--
-- Name: id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY locator_map ALTER COLUMN id SET DEFAULT nextval('locator_map_id_seq'::regclass);


--
-- Data for Name: locator_map; Type: TABLE DATA; Schema: public; Owner: -
--

COPY locator_map (id, data) FROM stdin;
1	{"slug": "the-news-building", "aspect-ratio": "tall", "dek": "This is the dek", "hed": "Test Hed", "lat": 51.505864, "lon": -0.087765, "minimap": true, "zoom": 15, "markers": [{"lat": 51.505864, "lon": -0.087765, "text": "The News Building", "icon": "square", "label": "callout", "label-direction": "north"}], "creation_date":1423845091336,"modification_date":1423845091336}
\.


--
-- Name: locator_map_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('locator_map_id_seq', 11, true);


--
-- Name: locator_map_pkey; Type: CONSTRAINT; Schema: public; Owner: -; Tablespace: 
--

ALTER TABLE ONLY locator_map
    ADD CONSTRAINT locator_map_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

