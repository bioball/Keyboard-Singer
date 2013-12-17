require 'sinatra'

get '/' do
  File.read(File.join('public', 'index.html'))
end