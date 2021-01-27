import React, { useContext, useMemo, useState } from 'react';
import { ThemeContext } from 'styled-components';
import {
  Box,
  Button,
  CheckBox,
  Footer,
  Form,
  FormField,
  Header,
  Heading,
  Layer,
  Select,
  TextArea,
  TextInput,
} from 'grommet';
import { Close, Down, Up } from 'grommet-icons';
import { delet, update } from './data';
import Auth from './Auth';

const RoadmapEdit = ({ roadmap, onChange, onDone }) => {
  const theme = useContext(ThemeContext);
  const [value, setValue] = useState(roadmap);
  const [changing, setChanging] = useState();
  const [auth, setAuth] = useState();

  const colors = useMemo(() => Object.keys(theme.global.colors).sort(), [
    theme,
  ]);

  const submit = (password) => {
    setChanging(true);
    setAuth(false);
    update(value, password)
      .then(() => {
        setChanging(false);
        onChange(value);
        onDone();
      })
      .catch((status) => {
        if (status === 401) setAuth(true);
        else onDone();
      });
  };

  return (
    <Layer position="top" onEsc={onDone}>
      <Box overflow="auto">
        <Header justify="end">
          <Button icon={<Close />} onClick={onDone} />
        </Header>
        <Box pad={{ horizontal: 'large', vertical: 'medium' }}>
          {auth ? (
            <Auth onChange={submit} />
          ) : (
            <Form value={value} onChange={setValue} onSubmit={() => submit()}>
              <FormField name="name" htmlFor="name" required>
                <TextInput name="name" id="name" placeholder="Name" />
              </FormField>
              <FormField name="password" htmlFor="password">
                <TextInput
                  name="password"
                  id="password"
                  placeholder="Password"
                  type="password"
                />
              </FormField>
              <FormField name="private" htmlFor="private">
                <CheckBox name="private" id="private" label="Private" toggle />
              </FormField>
              <FormField name="theme" htmlFor="theme">
                <Select
                  name="theme"
                  id="theme"
                  placeholder="Theme"
                  options={['grommet', 'hpe']}
                />
              </FormField>
              <FormField name="notes" htmlFor="notes" label="Notes">
                <TextArea name="notes" id="notes" fill />
              </FormField>
              <Box gap="small">
                <Heading level={3} size="small">
                  Sections
                </Heading>
                {value.sections.map((section, index) => (
                  <Box key={index} direction="row">
                    <TextInput
                      value={section}
                      onChange={(event) => {
                        const nextValue = JSON.parse(JSON.stringify(value));
                        const nextSection = event.target.value;
                        nextValue.sections[index] = nextSection;
                        nextValue.items.forEach((i) => {
                          if (i.section === section) i.section = nextSection;
                        });
                        setValue(nextValue);
                      }}
                    />
                    <Button
                      icon={<Up />}
                      disabled={index === 0}
                      onClick={() => {
                        const nextValue = JSON.parse(JSON.stringify(value));
                        const tmpSection = nextValue.sections[index - 1];
                        nextValue.sections[index - 1] = section;
                        nextValue.sections[index] = tmpSection;
                        setValue(nextValue);
                      }}
                    />
                    <Button
                      icon={<Down />}
                      disabled={index === roadmap.sections.length - 1}
                      onClick={() => {
                        const nextValue = JSON.parse(JSON.stringify(value));
                        const tmpSection = nextValue.sections[index + 1];
                        nextValue.sections[index + 1] = section;
                        nextValue.sections[index] = tmpSection;
                        setValue(nextValue);
                      }}
                    />
                  </Box>
                ))}
              </Box>
              <Box gap="small">
                <Heading level={3} size="small">
                  Labels
                </Heading>
                {value.labels.map((label, index) => (
                  <Box key={index} direction="row" gap="small">
                    <TextInput
                      placeholder="Name"
                      value={label.name}
                      onChange={(event) => {
                        const nextValue = JSON.parse(JSON.stringify(value));
                        const nextName = event.target.value;
                        nextValue.labels[index] = {
                          ...nextValue.labels[index],
                          name: nextName,
                        };
                        nextValue.items.forEach((i) => {
                          if (i.label === label.name) i.label = nextName;
                        });
                        setValue(nextValue);
                      }}
                    />
                    <Box pad="small" background={label.color} />
                    <TextInput
                      placeholder="Color"
                      suggestions={colors}
                      value={label.color || ''}
                      onChange={(event) => {
                        const nextValue = JSON.parse(JSON.stringify(value));
                        const nextColor = event.target.value;
                        nextValue.labels[index] = {
                          ...nextValue.labels[index],
                          color: nextColor,
                        };
                        setValue(nextValue);
                      }}
                      onSuggestionSelect={(event) => {
                        const nextValue = JSON.parse(JSON.stringify(value));
                        nextValue.labels[index] = {
                          ...nextValue.labels[index],
                          color: event.suggestion,
                        };
                        setValue(nextValue);
                      }}
                    />
                  </Box>
                ))}
              </Box>
              <Footer margin={{ vertical: 'medium' }}>
                <Button
                  type="submit"
                  label="Update"
                  primary
                  disabled={changing}
                />
                <Button
                  label="Delete"
                  onClick={() => {
                    setChanging(true);
                    delet(roadmap).then(() => {
                      setChanging(false);
                      onChange(undefined);
                      onDone();
                    });
                  }}
                />
              </Footer>
            </Form>
          )}
        </Box>
      </Box>
    </Layer>
  );
};

export default RoadmapEdit;
