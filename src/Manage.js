import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CheckBox,
  Form,
  FormField,
  Heading,
  List,
  Paragraph,
  TextInput,
} from 'grommet';
import { create, list } from './data';

const Manage = ({ onSelect }) => {
  const [identifiers, setIdentifiers] = useState([]);
  const [creating, setCreating] = useState();

  useEffect(() => setIdentifiers(list()), []);

  return (
    <Box
      flex={false}
      align="center"
      background="background-back"
      pad={{ bottom: 'xlarge' }}
    >
      <Heading>Grommet Roadmap</Heading>
      <Paragraph size="large" textAlign="center">
        Create a roadmap to communicate where you are headed over time
      </Paragraph>
      <Box pad="medium" background="background-front" round="small">
        <Form
          onSubmit={({ value }) => {
            setCreating(true);
            create(value).then((identifier) => {
              setCreating(false);
              onSelect(identifier);
            });
          }}
        >
          <FormField
            label="Choose a name for your roadmap"
            name="name"
            htmlFor="name"
            required
          >
            <TextInput id="name" name="name" />
          </FormField>
          <FormField
            label="Provide your email address"
            name="email"
            htmlFor="email"
            required
          >
            <TextInput id="email" name="email" type="email" />
          </FormField>
          <FormField
            label="Set a password"
            name="password"
            htmlFor="password"
            required
          >
            <TextInput id="password" name="password" type="password" />
          </FormField>
          <FormField
            name="private"
            htmlFor="private"
            label="Is the password required to view the roadmap?"
          >
            <CheckBox name="private" id="private" toggle label="private" />
          </FormField>
          <Button
            type="submit"
            label="create my roadmap"
            primary
            disabled={creating}
            margin={{ top: 'medium' }}
          />
        </Form>
      </Box>
      {identifiers.length > 0 && (
        <Box
          flex={false}
          alignSelf="stretch"
          align="center"
          border="top"
          margin={{ top: 'large' }}
        >
          <Heading level="2">Recent</Heading>
          <List
            data={identifiers}
            primaryKey="name"
            onClickItem={({ item }) => onSelect(item)}
          />
        </Box>
      )}
    </Box>
  );
};

export default Manage;
