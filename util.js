let util = {};

util.parseError = function(errors){
  let parsed = {};
  if (errors.name == `ValidationError`) {
    for (var name in errors.errors) {
      let validationError = errors.errors[name];
      parsed[name] = { message: validationError.message };
    }
  } else if (errors.code == `11000` && errors.errmsg.indexOf(`username`) > 0) {
    parsed.username = { message: `This username already exists!` };
  } else {
    parsed.unhandled = JSON.stringify(errors);
  }

  return parsed;
}

module.exports = util;
