require 'sinatra'

set :bind, '0.0.0.0'

get '/' do
  File.read(File.join('public', 'index.html'))
end