import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Grid,
  Header,
  Heading,
  Keyboard,
  Markdown,
  ResponsiveContext,
  Text,
  ThemeContext,
} from 'grommet';
import {
  Add,
  Blank,
  CircleInformation,
  Figma,
  Github,
  Link,
  More,
  Navigate,
  Next,
  Previous,
} from 'grommet-icons';
import { grommet } from 'grommet/themes';
import { hpe } from 'grommet-theme-hpe';
import { addMonths, sameMonth, subtractMonths } from './utils';
import { get, update } from './data';
import Swipe from './Swipe';
import ItemEdit from './ItemEdit';
import RoadmapEdit from './RoadmapEdit';
import Auth from './Auth';

const themes = {
  hpe: hpe,
  grommet: grommet,
};

const monthCounts = {
  small: 1,
  medium: 3,
  large: 4,
};

const columnPercents = {
  small: 'full',
  medium: '33.33%',
  large: '25%',
};

const now = new Date();
now.setDate(1);

const Roadmap = ({ identifier, onClose }) => {
  const responsive = useContext(ResponsiveContext);
  const [date, setDate] = useState(now);
  const [auth, setAuth] = useState();
  const [password, setPassword] = React.useState();
  const [roadmap, setRoadmap] = useState();
  const [editing, setEditing] = useState();
  const [editRoadmap, setEditRoadmap] = useState();
  const [itemIndex, setItemIndex] = useState();
  const [dragging, setDragging] = React.useState();
  const [dropTarget, setDropTarget] = React.useState();
  const [prevTarget, setPrevTarget] = React.useState();
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    get(password ? { ...identifier, password } : identifier)
      .then(setRoadmap)
      .catch((status) => {
        if (status === 401) setAuth(true);
        if (status === 404) onClose();
      });
  }, [identifier, onClose, password]);

  useEffect(() => {
    if (roadmap) document.title = roadmap.name;
  }, [roadmap]);

  const items = useMemo(
    () =>
      roadmap
        ? roadmap.items.map((item, index) => ({ ...item, index }))
        : undefined,
    [roadmap],
  );

  // months to show, array of Date objects
  const months = useMemo(
    () =>
      Array.from(Array(monthCounts[responsive])).map((_, i) =>
        addMonths(date, i),
      ),
    [date, responsive],
  );

  // normalize data for how we want to display it
  // section -> month -> items
  const sections = useMemo(() => {
    let result = [];
    if (roadmap) {
      const monthsItems = items.filter(({ dateFields }) =>
        months.some((month) =>
          dateFields.some((dateField) => sameMonth(month, dateField.date)),
        ),
      );
      result = roadmap.sections
        .map((name) => ({
          name,
          months: months.map((month) => ({
            month,
            items: monthsItems.filter(({ section, dateFields }) =>
              dateFields.some(
                (dateField) =>
                  name === section && sameMonth(month, dateField.date),
              ),
            ),
          })),
        }))
        .filter((s) => s.months.some((m) => m.items.length) && s.name !== '');
      // add any non-section items
      const nonSectionItems = monthsItems.filter(({ section }) => !section);
      if (nonSectionItems.length) {
        result.push({
          months: months.map((month) => ({
            month,
            items: nonSectionItems.filter(({ dateFields }) =>
              dateFields.some((dateField) => sameMonth(month, dateField.date)),
            ),
          })),
        });
      }
    }
    return result;
  }, [items, months, roadmap]);

  const Row = (props) => {
    if (responsive === 'small') return <Box {...props} />;
    return (
      <Grid
        columns={[
          'flex',
          ['small', responsive === 'medium' ? 'xlarge' : '80vw'],
          'flex',
        ]}
      >
        <Box />
        <Grid columns={columnPercents[responsive]} {...props} />
        <Box />
      </Grid>
    );
  };

  const onNext = useCallback(() => setDate(addMonths(date, 1)), [date]);
  const onPrevious = useCallback(() => setDate(subtractMonths(date, 1)), [
    date,
  ]);

  const moveItem = useCallback(
    (event) => {
      const nextRoadmap = JSON.parse(JSON.stringify(roadmap));
      const nextItem = nextRoadmap.items.find((_, index) => index === dragging);
      for (var x in nextItem.dateFields) {
        if (
          !sameMonth(nextItem.dateFields[x].date, dropTarget.toISOString()) &&
          sameMonth(nextItem.dateFields[x].date, prevTarget.toISOString())
        ) {
          nextItem.dateFields[x].date = dropTarget.toISOString();
          nextItem[`DateTarget${x}`] = nextItem.dateFields[x].date;
        }
      }
      event.dataTransfer.clearData();
      setRoadmap(nextRoadmap);
      setDragging(undefined);
      setDropTarget(undefined);
      setPrevTarget(undefined);
      update(nextRoadmap, password)
        .then(() => {
          // ???
        })
        .catch((status) => {
          if (status === 401) setAuth(true);
        });
    },
    [dragging, dropTarget, prevTarget, password, roadmap],
  );

  if (auth)
    return (
      <Auth
        onChange={(nextPassword) => {
          setPassword(nextPassword);
          setAuth(false);
        }}
      />
    );

  if (!roadmap)
    return (
      <Box fill align="center" justify="center" pad="xlarge">
        <Box animation={['fadeIn', 'pulse']}>
          <Navigate />
        </Box>
      </Box>
    );

  return (
    <ThemeContext.Extend value={themes[roadmap.theme] || themes.grommet}>
      <Keyboard
        target="document"
        onRight={onNext}
        onLeft={onPrevious}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === '.') {
            event.preventDefault();
            setEditing(!editing);
          }
        }}
      >
        <Swipe
          fill
          onSwipeLeft={onNext}
          onSwipeRight={onPrevious}
          background={editing ? { color: 'background-contrast' } : undefined}
          gap="small"
        >
          <Header background={{ color: 'background-contrast' }} pad="small">
            <Button icon={<Navigate />} onClick={onClose} />
            <Heading textAlign="center" size="small" margin="none">
              {editing ? (
                <Button
                  size="xlarge"
                  label={roadmap.name}
                  onClick={() => setEditRoadmap(true)}
                />
              ) : (
                roadmap.name
              )}
            </Heading>
            {editing ? (
              <Button icon={<Add />} onClick={() => setItemIndex(-1)} />
            ) : roadmap.notes ? (
              <Button
                icon={<CircleInformation />}
                onClick={() => setShowNotes(!showNotes)}
              />
            ) : (
              <Blank />
            )}
          </Header>
          <Box flex={false}>
            {showNotes && (
              <Grid
                columns={[
                  'flex',
                  ['small', responsive === 'medium' ? 'xlarge' : '80vw'],
                  'flex',
                ]}
              >
                <Box />
                <Box pad="small" fill>
                  <Markdown>{roadmap.notes}</Markdown>
                </Box>
                <Box />
              </Grid>
            )}
            <Row>
              {months.map((month, index) => (
                <Box
                  key={month}
                  direction="row"
                  align="center"
                  justify="between"
                >
                  {index === 0 ? (
                    <Button
                      icon={<Previous />}
                      hoverIndicator
                      onClick={onPrevious}
                    />
                  ) : (
                    <Blank />
                  )}
                  <Heading level={2} size="small">
                    {month.toLocaleString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Heading>
                  {index === months.length - 1 ? (
                    <Button icon={<Next />} hoverIndicator onClick={onNext} />
                  ) : (
                    <Blank />
                  )}
                </Box>
              ))}
            </Row>
          </Box>
          <Box flex overflow="auto" pad={{ bottom: 'large' }}>
            {Object.values(sections).map(({ name, months }) => (
              <Box flex={false} key={name || 'none'}>
                <Row>
                  <Heading level={3} size="xsmall" margin="small">
                    {name}
                  </Heading>
                </Row>
                <Row>
                  {months.map(({ month, items }, index) => (
                    <Box
                      key={month}
                      gap="medium"
                      pad={{ vertical: 'medium', horizontal: 'small' }}
                      background={
                        index % 2 === 0
                          ? 'background-contrast'
                          : 'background-back'
                      }
                      responsive={false}
                      onDragEnter={(event) => {
                        if (dragging !== undefined) {
                          event.preventDefault();
                          setDropTarget(month);
                        } else {
                          setDropTarget(undefined);
                        }
                      }}
                      onDragOver={(event) => {
                        if (dragging !== undefined) event.preventDefault();
                      }}
                      onDrop={moveItem}
                    >
                      {items.map(
                        ({ dateFields, index, linkFields, name, note }) => {
                          const labels = [];
                          for (var x in dateFields) {
                            const stage = dateFields[x].stage;
                            labels.push(
                              roadmap.labels.find(({ name }) => name === stage),
                            );
                          }
                          let content = (
                            <Card
                              key={name}
                              draggable={editing}
                              onDragStart={(event) => {
                                // for Firefox
                                event.dataTransfer.setData('text/plain', '');
                                setDragging(index);
                                setPrevTarget(month);
                              }}
                              onDragEnd={() => {
                                setDragging(undefined);
                                setDropTarget(undefined);
                                setPrevTarget(undefined);
                              }}
                              elevation="small"
                            >
                              <Box
                                fill="horizontal"
                                align="end"
                                pad={{
                                  top: 'xsmall',
                                  bottom: 'xsmall',
                                  horizontal: 'medium',
                                }}
                              >
                                {editing ? (
                                  <Blank />
                                ) : (
                                  <Button
                                    plain
                                    icon={<More color="border" />}
                                    onClick={() =>
                                      editing ? undefined : setItemIndex(index)
                                    }
                                  />
                                )}
                              </Box>
                              <Box
                                justify="between"
                                direction="row"
                                overflow="scroll"
                              >
                                <CardHeader
                                  wrap={true}
                                  pad={{
                                    top: 'none',
                                    bottom: 'medium',
                                    horizontal: 'medium',
                                  }}
                                  justify="start"
                                  gap="none"
                                  align="start"
                                  direction="column"
                                >
                                  <Heading margin="none" size="small" level={4}>
                                    {name}
                                  </Heading>
                                  <Text size="small">{note}</Text>
                                </CardHeader>
                                <CardBody
                                  flex={false}
                                  pad={{
                                    top: 'none',
                                    bottom: 'medium',
                                    horizontal: 'medium',
                                  }}
                                  gap="small"
                                >
                                  {linkFields.map((linkField, index) => (
                                    <Box key={`iconBox${index}`} align="center">
                                      {linkField.linkUrl &&
                                        (linkField.linkUrl.includes(
                                          'figma.com',
                                        ) ||
                                        linkField.linkUrl.includes(
                                          'github.com',
                                        ) ? (
                                          linkField.linkUrl.includes(
                                            'github.com',
                                          ) ? (
                                            <Button
                                              plain
                                              icon={<Github />}
                                              href={linkField.linkUrl}
                                            />
                                          ) : (
                                            <Button
                                              plain
                                              icon={<Figma color="plain" />}
                                              href={linkField.linkUrl}
                                            />
                                          )
                                        ) : (
                                          <Button
                                            plain
                                            icon={<Link />}
                                            href={linkField.linkUrl}
                                          />
                                        ))}
                                    </Box>
                                  ))}
                                </CardBody>
                              </Box>
                              {dateFields.map((dateField, index) => {
                                if (sameMonth(month, dateField.date)) {
                                  return (
                                    <CardFooter
                                      pad={{
                                        vertical: 'small',
                                        horizontal: 'medium',
                                      }}
                                      background={
                                        labels[index] && labels[index].color
                                          ? labels[index].color
                                          : ''
                                      }
                                      key={`${index}footer`}
                                    >
                                      <Text
                                        size="small"
                                        weight="bold"
                                        key={`${index}stage`}
                                      >
                                        {dateField.stage}
                                      </Text>
                                      <Text
                                        size="small"
                                        weight="bold"
                                        key={`${index}progress`}
                                      >
                                        {dateField.progress}
                                      </Text>
                                    </CardFooter>
                                  );
                                }
                                return null;
                              })}
                            </Card>
                          );
                          if (editing)
                            content = (
                              <Button
                                key={name}
                                plain
                                onClick={
                                  editing
                                    ? () => setItemIndex(index)
                                    : undefined
                                }
                              >
                                {content}
                              </Button>
                            );
                          return content;
                        },
                      )}
                    </Box>
                  ))}
                </Row>
              </Box>
            ))}
          </Box>
          {itemIndex !== undefined && (
            <ItemEdit
              index={itemIndex}
              roadmap={roadmap}
              onChange={setRoadmap}
              onDone={() => setItemIndex(undefined)}
            />
          )}
          {editRoadmap && (
            <RoadmapEdit
              roadmap={roadmap}
              onChange={(nextRoadmap) => {
                if (nextRoadmap) setRoadmap(nextRoadmap);
                else onClose();
              }}
              onDone={() => setEditRoadmap(false)}
            />
          )}
          {editing && (
            <Box
              align="center"
              pad="xsmall"
              background={{ color: 'background-front', dark: true }}
            >
              <Text size="large">editing</Text>
            </Box>
          )}
        </Swipe>
      </Keyboard>
    </ThemeContext.Extend>
  );
};

export default Roadmap;
