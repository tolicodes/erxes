import {
  AvatarUpload,
  ControlLabel,
  FormControl,
  FormGroup
} from 'modules/common/components';
import {
  ColumnTitle,
  FormColumn,
  FormWrapper
} from 'modules/common/styles/main';
import { __ } from 'modules/common/utils';
import { timezones } from 'modules/settings/integrations/constants';
import * as React from 'react';
import { IUser } from '../types';

type Props = {
  user: IUser;
  onAvatarUpload: (url: string) => void;
};

class UserCommonInfos extends React.PureComponent<Props> {
  render() {
    const { user, onAvatarUpload } = this.props;
    const details = user.details || {};
    const links = user.links || {};
    const composeValidators = (...validators) => value =>
      validators.reduce(
        (error, validator) => error || validator(value),
        undefined
      );
    const required = value => (value ? undefined : 'Required');
    const mustBeNumber = value =>
      isNaN(value) ? 'Must be a number' : undefined;
    const minValue = min => value =>
      isNaN(value) || value >= min
        ? undefined
        : `Should be greater than ${min}`;

    return (
      <React.Fragment>
        <AvatarUpload avatar={details.avatar} onAvatarUpload={onAvatarUpload} />
        <FormWrapper>
          <FormColumn>
            <FormGroup>
              <ControlLabel>Full name</ControlLabel>
              <FormControl
                type="email"
                id="fullName"
                defaultValue={details.fullName || ''}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Short name</ControlLabel>
              <FormControl
                type="text"
                id="shortName"
                defaultValue={details.shortName || ''}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel required={true}>Email</ControlLabel>
              <FormControl
                type="text"
                id="email"
                name="email"
                value={user.email}
                validate="isEmail"
                validation={['required']}
                validationError="Not valid email format"
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Description</ControlLabel>
              <FormControl
                type="text"
                id="description"
                componentClass="textarea"
                value={details.description || ''}
                validation={['required']}
              />
            </FormGroup>
          </FormColumn>
          <FormColumn>
            <FormGroup>
              <ControlLabel required={true}>Username</ControlLabel>
              <FormControl
                type="text"
                id="username"
                defaultValue={user.username}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Position</ControlLabel>
              <FormControl
                type="text"
                id="position"
                defaultValue={details.position || ''}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Location</ControlLabel>
              <FormControl
                componentClass="select"
                defaultValue={details.location}
                id="user-location"
                options={timezones}
              />
            </FormGroup>
          </FormColumn>
        </FormWrapper>
        <ColumnTitle>{__('Links')}</ColumnTitle>
        <FormWrapper>
          <FormColumn>
            <FormGroup>
              <ControlLabel>LinkedIn</ControlLabel>
              <FormControl
                type="text"
                id="linkedin"
                defaultValue={links.linkedIn || ''}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Twitter</ControlLabel>
              <FormControl
                type="text"
                id="twitter"
                defaultValue={links.twitter || ''}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Facebook</ControlLabel>
              <FormControl
                type="text"
                id="facebook"
                defaultValue={links.facebook || ''}
              />
            </FormGroup>
          </FormColumn>
          <FormColumn>
            <FormGroup>
              <ControlLabel>Youtube</ControlLabel>
              <FormControl
                type="text"
                id="youtube"
                defaultValue={links.youtube || ''}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Github</ControlLabel>
              <FormControl
                type="text"
                id="github"
                defaultValue={links.github || ''}
              />
            </FormGroup>
            <FormGroup>
              <ControlLabel>Website</ControlLabel>
              <FormControl
                type="text"
                id="website"
                defaultValue={links.website || ''}
              />
            </FormGroup>
          </FormColumn>
        </FormWrapper>
      </React.Fragment>
    );
  }
}

export default UserCommonInfos;
